const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    owner: String,
    text: String,
    date: String
});

module.exports = mongoose.model("Note", noteSchema);