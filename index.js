const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const port = 3000;
const cors = require('cors');

// Increase limit for JSON payload
app.use(express.json({ limit: '30mb' })); // Adjust the size as needed
app.use(express.urlencoded({ limit: '30mb', extended: true }));

//app.use(express.json());
app.use(cors());

//ngrok http --url=pumped-enough-newt.ngrok-free.app 3000
//ngrok command to start a tunnel from port 3000


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/FixMyStreetDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});


const potholeSchema = new mongoose.Schema({
    image: String,  // Base64 encoded image 
    latitude: Number,
    longitude: Number,
    address: String,
    submittedBy: String,
    resolved: Boolean,
    threat: Number,
    comment: String
});

const Pothole = mongoose.model('Pothole', potholeSchema);


const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    access: String
});

const User = mongoose.model('User', userSchema);

// POST: Add User
app.post('/addUser', async (req, res) => {
    try {
        const { name, password, access } = req.body;
        const newUser = new User({ name, password, access });
        await newUser.save();
        res.status(201).json({ message: 'User added successfully', id: newUser._id });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Server error');
    }
});

// POST: Validate Login
app.post('/validateLogin', async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findOne({ name, password });
        if (user) {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error validating login:', error);
        res.status(500).send('Server error');
    }
});

// POST: Upload Pothole (Add Pothole)
app.post('/uploadImage', async (req, res) => {
    try {
        let { image, address, latitude, longitude, submittedBy } = req.body;

        // Check if the image is provided and add the prefix if not already present
        const base64Prefix = 'data:image/jpeg;base64,';
        if (!image) {
            return res.status(400).json({ error: 'Image not provided' });
        }

        if (!image.startsWith(base64Prefix)) {
            image = base64Prefix + image;
        }

        const newPothole = new Pothole({
            image,  // Base64 encoded image
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address,
            submittedBy,
            resolved: false,
            threat: 0
        });

        await newPothole.save();
        res.status(201).json({ id: newPothole._id });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).send('Server error');
    }
});

// PUT: Update Image by Pothole ID
app.put('/updateImage', async (req, res) => {
    try {
        const { id, image } = req.body;

        // Validate input
        if (!id || !image) {
            return res.status(400).json({ error: 'ID and Base64 encoded image are required' });
        }

        // Find the pothole by ID
        const pothole = await Pothole.findById(id);
        if (!pothole) {
            return res.status(404).json({ error: 'Pothole not found' });
        }

        // Update the image
        pothole.image = `data:image/jpeg;base64,${image}`; // Assuming the image is JPEG
        await pothole.save();

        res.status(200).json({ message: 'Image updated successfully', id: pothole._id });
    } catch (error) {
        console.error('Error updating image:', error);
        res.status(500).send('Server error');
    }
});

// PUT: Mark Pothole as Resolved by ID
app.put('/markAsResolved/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { submittedBy } = req.body;

        const pothole = await Pothole.findById(id);

        if (!pothole) {
            return res.status(404).json({ error: 'Pothole not found' });
        }

        pothole.resolved = true;
        await pothole.save();
        res.status(200).json({ message: 'Pothole marked as resolved' });
    } catch (error) {
        console.error('Error marking pothole as resolved:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve All Cases
app.get('/getAllCases', async (req, res) => {
    try {
        const potholes = await Pothole.find({});
        res.status(200).json(potholes);
    } catch (error) {
        console.error('Error retrieving cases:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve All Pending Cases
app.get('/getAllPending', async (req, res) => {
    try {
        const pendingPotholes = await Pothole.find({ resolved: false });
        res.status(200).json(pendingPotholes);
    } catch (error) {
        console.error('Error retrieving pending cases:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve All Resolved Cases
app.get('/getAllResolved', async (req, res) => {
    try {
        const resolvedPotholes = await Pothole.find({ resolved: true });
        res.status(200).json(resolvedPotholes);
    } catch (error) {
        console.error('Error retrieving resolved cases:', error);
        res.status(500).send('Server error');
    }
});

// POST: Retrieve All Cases Submitted by a Specific User
app.post('/getAllSentByUser', async (req, res) => {
    try {
        const { submittedBy } = req.body;
        const userPotholes = await Pothole.find({ submittedBy });
        res.status(200).json(userPotholes);
    } catch (error) {
        console.error('Error retrieving user cases:', error);
        res.status(500).send('Server error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
