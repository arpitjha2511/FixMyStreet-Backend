const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios'); // For making external API requests
const app = express();
const port = 3000;
const cors = require('cors');
//ngrok startup command: 
// ngrok http --url=wildcat-mint-actually.ngrok-free.app 3000
// Increase limit for JSON payload
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

app.use((req, res, next) => {
    req.setTimeout(60000); // Set timeout to 60 seconds (60000 ms)
    next();
});

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
    image: String, // Base64 encoded image
    latitude: String,
    longitude: String,
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
        let { image, latitude, longitude, address, submittedBy } = req.body;

        // Add base64 prefix to the image if not already present
        const base64Prefix = 'data:image/jpeg;base64,';
        if (!image) {
            return res.status(400).json({ error: 'Image not provided' });
        }
        if (!image.startsWith(base64Prefix)) {
            image = base64Prefix + image;
        }

        // Create a new Pothole entry with a default threat level
        const newPothole = new Pothole({
            image,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address,
            submittedBy,
            resolved: false,
            threat: 0
        });

        // Save the initial pothole entry to get the unique ID
        const savedPothole = await newPothole.save();

        // Send the image and image_id to the external API
        const response = await axios.post('https://touching-subtle-bat.ngrok-free.app/detect_potholes', {
            image,
            id: savedPothole._id.toString()
        }, 
        { timeout: 60000 }
    );

        const { image: updatedImage, severity } = response.data;

        // Ensure updatedImage has the prefix before saving
        const finalImage = updatedImage.startsWith(base64Prefix) ? updatedImage : base64Prefix + updatedImage;

        // Update the saved pothole with the processed image and severity level
        savedPothole.image = finalImage;
        savedPothole.threat = severity;
        await savedPothole.save();

        res.status(201).json({ id: savedPothole._id });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).send('Server error');
    }
});

// PUT: Update Image by Pothole ID
app.put('/updateImage', async (req, res) => {
    try {
        const { id, image } = req.body;

        if (!id || !image) {
            return res.status(400).json({ error: 'ID and Base64 encoded image are required' });
        }

        const pothole = await Pothole.findById(id);
        if (!pothole) {
            return res.status(404).json({ error: 'Pothole not found' });
        }

        pothole.image = `data:image/jpeg;base64,${image}`;
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

// GET: Retrieve All Cases in Descending Order of Threat Level
app.get('/getAllCases', async (req, res) => {
    try {
        const potholes = await Pothole.find({}).sort({ threat: -1 });
        res.status(200).json(potholes);
    } catch (error) {
        console.error('Error retrieving cases:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve All Pending Cases in Descending Order of Threat Level
app.get('/getAllPending', async (req, res) => {
    try {
        const pendingPotholes = await Pothole.find({ resolved: false }).sort({ threat: -1 });
        res.status(200).json(pendingPotholes);
    } catch (error) {
        console.error('Error retrieving pending cases:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve All Resolved Cases in Descending Order of Threat Level
app.get('/getAllResolved', async (req, res) => {
    try {
        const resolvedPotholes = await Pothole.find({ resolved: true }).sort({ threat: -1 });
        res.status(200).json(resolvedPotholes);
    } catch (error) {
        console.error('Error retrieving resolved cases:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve Pothole by ID
app.get('/getPotholeById/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pothole = await Pothole.findById(id);
        if (!pothole) {
            return res.status(404).json({ error: 'Pothole not found' });
        }
        res.status(200).json(pothole);
    } catch (error) {
        console.error('Error retrieving pothole by ID:', error);
        res.status(500).send('Server error');
    }
});

// GET: Retrieve All Cases Submitted by a Specific User in Descending Order of Threat Level
app.get('/getAllSentByUser/:submittedBy', async (req, res) => {
    try {
        const { submittedBy } = req.params;
        const userPotholes = await Pothole.find({ submittedBy }).sort({ threat: -1 });
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
