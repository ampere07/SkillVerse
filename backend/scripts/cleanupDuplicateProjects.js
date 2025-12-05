import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanupDuplicateProjects = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const MiniProject = mongoose.model('MiniProject', new mongoose.Schema({}, { strict: false }));
    
    const miniProjects = await MiniProject.find({});
    console.log(`Found ${miniProjects.length} miniproject documents`);

    for (const miniProject of miniProjects) {
      const javaProjects = miniProject.availableProjects.filter(p => p.language === 'Java');
      const pythonProjects = miniProject.availableProjects.filter(p => p.language === 'Python');
      
      console.log(`\nUser: ${miniProject.userId}`);
      console.log(`  Java projects: ${javaProjects.length}`);
      console.log(`  Python projects: ${pythonProjects.length}`);
      console.log(`  Total: ${miniProject.availableProjects.length}`);
      
      // Keep only the most recent 6 projects per language
      const recentJavaProjects = javaProjects
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6);
      
      const recentPythonProjects = pythonProjects
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6);
      
      miniProject.availableProjects = [...recentJavaProjects, ...recentPythonProjects];
      
      await miniProject.save();
      
      console.log(`  ✅ Cleaned up to ${miniProject.availableProjects.length} projects (6 Java + 6 Python max)`);
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('All users now have maximum 6 projects per language.');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupDuplicateProjects();
