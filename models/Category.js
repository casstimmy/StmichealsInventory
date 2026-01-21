import mongoose, { model, Schema, models } from 'mongoose';

const CategorySchema = new Schema({
    name: {type: String, require: true},
    parent: {type: mongoose.Types.ObjectId, ref:'Category'},
    properties: [{type: Object}],
    images: [{type: String}], // Array of image URLs

});

export default models?.Category || model('Category', CategorySchema);

export const Category = models?.Category || model('Category', CategorySchema);