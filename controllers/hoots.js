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
        .populate(['author', 'comments.author']);
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

//Comment Routes

//POST /hoots/:hootId/comments - CREATE Route 'Protected'
router.post('/:hootId/comments', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id; //add requesting user as author
        const hoot = await Hoot.findById(req.params.hootId);
        hoot.comments.push(req.body);
        await hoot.save();

        //Find the newly created comment
        const newComment = hoot.comments[hoot.comments.length - 1]; //get most recent comment
        newComment._doc.author = req.user; //add requesting user's details
        res.status(201).json(newComment);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.mesage});
        
    }
});

//PUT /hoots/:hootId/comments/:commentId UPDATE Route 'Protected'
router.put('/:hootId/comments/:commentId', verifyToken, async (req,res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        const comment = hoot.comments.id(req.params.commentId);
    
        //ensure current user is author of comment
        if(comment.author.toString() !== req.user._id) {
            return res.status(403).json({message: 'You\'re not authorized to edit this comment!'});
        }
    
        comment.text = req.body.text;
        await hoot.save();
        res.status(200).json({message: 'Comment updated successfully!'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

//DELETE /hoots/:hootId/comments/:commentId - DELETE Route 'Protected'
router.delete('/:hootId/comments/:commentId', verifyToken, async (req,res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        const comment = hoot.comments.id(req.params.commentId);
    
        if (comment.author.toString() !== req.user._id) {
            return res.status(403).json({message: 'You\'re not authorized to delete this comment!'});
        }
        hoot.comments.remove({_id: req.params.commentId});
        await hoot.save();
        res.status(200).json({message: 'Comment deleted successfully!'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});

module.exports = router;