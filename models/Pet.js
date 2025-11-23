const mongoose = require("mongoose");

const PetSchema = new mongoose.Schema({
    name: String,
    image: String,
    breed: String,
    age: String //pets can be several months to a few years old
});

const PetModel = mongoose.model("Pet", PetSchema);

module.exports = PetModel;
