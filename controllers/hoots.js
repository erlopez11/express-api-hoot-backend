const express = require('express');
const verifyToken = require('../middleware/verify-token');
const Hoot = require('../models/hoot');
const router = express.Router();

//POST /hoots - CREATE Route 'Proetcted'
router.post('/', verifyToken, async (req, res) => {
    try {
        //add the logged in user's id  to the author field
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        //sends back copy of something that has been created
        hoot._doc.author = req.user;
        res.status(201).json(hoot);
    } catch (error) {
        // TODO remove console.log before production
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

//GET /hoots - READ Route 'Protected'
router.get('/', verifyToken, async (req, res) => {
    try {
        const hoots = await Hoot.find({}) //no semicolon b/c we are method chaining populate & sort
        .populate('author')
        .sort({createdAt: 'desc'});
        res.status(200).json(hoots);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

//GET /hoots/:hootId - READ Route 'Protected'
router.get('/:hootId', verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId)
        .populate('author');
        res.status(200).json(hoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

//PUT /hoots/:hootId - UPDATE Route 'Protected'
router.put('/:hootId', verifyToken, async (req, res) => {
    try {
        //Find the Hoot
        const hoot = await Hoot.findById(req.params.hootId);

        //Make sure requesting user and author are the same person
        if(!hoot.author.equals(req.user._id)) { //if they are not equal
            return res.status(403).send('You\'re not allowed to do that!');
        }

        //Performe the Update
        const updatedHoot = await Hoot.findByIdAndUpdate(
            req.params.hootId,
            req.body,
            {new: true} 
        );
        // {new:true} returns the document AFTER the update
        //without it it returns the unedited copy in case you want to revert back

        updatedHoot._doc.author = req.user;
        res.status(200).json(updatedHoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

//DELETE /hoots/:hootId - DELETE Route 'Protected'
router.delete('/:hootId', verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        if(!hoot.author.equals(req.user._id)) {
            return res.status(403).send('You\'re not allowed to do that!');
        }
        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
        res.status(200).json(deletedHoot); //will return deleted copy to go back and revert delete
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

module.exports = router;