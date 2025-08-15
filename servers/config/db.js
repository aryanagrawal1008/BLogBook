const mongoose = require('mongoose');
 
const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log('MongoDB Connected... ${conn.connection.host}');
    } catch (err) {
        console.error(err.message);
        
    }
};

module.exports = connectDB;