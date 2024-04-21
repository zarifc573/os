//server/appuser.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const generateUID = require('./utils/generateUID');
const cors = require('cors');
const Users = require('./models/users'); // Adjust the path as needed based on your project structure
mongoose.connect('mongodb');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const UserProjects = require('./models/userprojects');
// const BusinessModelSlabs = require('./models/businessModelSlabsModel');
const Roles= require('./models/roles');
const app = express();

app.use(bodyParser.json());
app.use(cors()); 


//insertuser


app.post('/api/insertuser', async (req, res) => {
  try {
    const { firstName, lastName, middleName, salutation, email, password, description, businessModel, goal_type,currentRevenue, growthTarget} = req.body;

    console.log('Incoming data:', req.body);
    const uuid = generateUID(); // Assuming generateUID() generates a unique ID

    // Check if the email already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const createdBy = uuid; // Set the UUID of the user creating the record
    const updatedBy = createdBy;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Users({
      uuid,
      email,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      salutation,
      password: hashedPassword, // Store the hashed password
      created_by: createdBy,
      updated_by: updatedBy
    });

    await newUser.save();
    //const selectedSlab = await BusinessModelSlabs.findOne({ goal_name: goal_type });
//insert userproject
    const newProject = new UserProjects({
      user_id: uuid, // Use the UUID of the user
      brief_text:description,
      model_type:businessModel,
      goal_type, 
      goal_current_state:currentRevenue,
      goal_target_state:growthTarget,
      created_by: createdBy,
      updated_by: updatedBy
    });

    await newProject.save();

    res.status(201).json({ message: 'User and project created successfully', uuid });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: err.message });
  }
});


//update project

app.put('/api/updateusers/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const { description, businessModel, goal_type, currentRevenue, growthTarget } = req.body;

    const updatedFields = {
      brief_text: description,
      model_type: businessModel,
      goal_type,
      goal_current_state: currentRevenue,
      goal_target_state: growthTarget,
    };

    const updatedUserprojects = await UserProjects.findOneAndUpdate({ user_id: uuid }, updatedFields, { new: true });

    if (!updatedUserprojects) {
      return res.status(404).json({ message: 'User projects not found' });
    }

    res.json({ message: 'User projects updated successfully', userProjects: updatedUserprojects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//add companysize and industry and website in page companydetails
app.put('/api/updateproject/:uuid', async (req, res) => {
  try {
    const { role, companysize, industry, website } = req.body;
    const { uuid } = req.params;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    if (!companysize) {
      return res.status(400).json({ message: 'CompanySize is required' });
    }

    if (!industry) {
      return res.status(400).json({ message: 'Industry is required' });
    }

    const project = await UserProjects.findOne({ user_id: uuid });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.role = role;
    project.companysize = companysize;
    project.industry = industry;
    project.website = website;

    await project.save();

    res.status(200).json({ message: ' save is  successfully', uuid });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

//add role
app.post('/api/roles/:uuid', async (req, res) => {
  try {


    const { name } = req.body; 
    const uuid = req.params.uuid;
    const roles = new Roles({
      name: name,
      created_by: uuid,
      updated_by: uuid
    });

    const savedRole = await roles.save();
    res.json(savedRole);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// add new project




app.get('/api/business_model_slabs', async (req, res) => {
  const { revenueBasecurrent, revenueGrowthTargets, userBasecurrent, UserBaseGrowthTargets } = require('./models/businessModelSlabsModel');

  const { goal_name } = req.query;
  try {
   
    switch (goal_name) {
      case 'RevenueBase':
        ques1 = revenueBasecurrent;
        ques2 = revenueGrowthTargets;
        break;
      case 'UserBase':
        ques1 = userBasecurrent;
        ques2 = UserBaseGrowthTargets;
        break;
      default:
        // Return an empty array if goal_name doesn't match any of the predefined slabs
        break;
    }

    // Combine both slabs arrays into one response
    let allSlabs = [];
    if (ques1.length > 0) {
      allSlabs.push({ goal_name: goal_name, ques1: ques1});
    }
    if (ques2.length > 0) {
      allSlabs.push({ goal_name: goal_name,ques2: ques2 });
    }
    res.json(allSlabs);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});







//send invitation 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'albertmadani01@gmail.com',
    pass: 'mmtqibuxelxzroyg',
  }
});

app.post('/invite/:uuid', async (req, res) => {
   try {
    const { uuid } = req.params;
    const { firstName, email } = req.body;

    if (!uuid || !firstName || !email) {
      return res.status(400).json({ message: 'User ID, first name, and email are required.' });
    }

    // Find the user based on the provided user ID
    
    const users = await Users.findOne({ uuid: uuid });
    if (!users) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Send the invitation email
    await transporter.sendMail({
      from: users.email,
      to: email,
      subject: 'Invitation',
      text: `Hello ${firstName}, you have been invited!`
    });

    res.status(201).json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


app.listen(5000, () => {
  console.log('Server running on port 5000');
});