import Classroom from '../models/Classroom.js';

export const classroomService = {
  async getAllActiveClassrooms() {
    return await Classroom.find({ isActive: true })
      .populate('teacher', 'firstName middleInitial lastName email')
      .lean()
      .sort({ createdAt: -1 });
  },

  async getTeacherClassrooms(teacherId) {
    return await Classroom.find({ 
      teacher: teacherId,
      isActive: true 
    })
    .populate('teacher', 'firstName middleInitial lastName email')
    .populate('students.studentId', 'firstName middleInitial lastName email')
    .sort({ createdAt: -1 });
  },

  async getStudentClassrooms(studentId) {
    const classrooms = await Classroom.find({ 
      'students.studentId': studentId,
      isActive: true 
    })
    .populate('teacher', 'firstName middleInitial lastName email')
    .sort({ createdAt: -1 });

    console.log('Student classrooms:', classrooms.length);
    classrooms.forEach(c => {
      console.log(`Classroom: ${c.name}, Teacher:`, c.teacher);
    });

    return classrooms;
  },

  async getClassroomById(classroomId) {
    return await Classroom.findById(classroomId)
      .populate('teacher', 'firstName middleInitial lastName email')
      .populate('students.studentId', 'firstName middleInitial lastName email');
  },

  async createClassroom(data) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Classroom.generateCode();
      const existing = await Classroom.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
    }

    const classroom = new Classroom({
      ...data,
      code
    });

    await classroom.save();
    await classroom.populate('teacher', 'firstName middleInitial lastName email');
    return classroom;
  },

  async updateClassroom(classroomId, data) {
    console.log('Updating classroom:', classroomId, 'with data:', data);
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      throw new Error('Classroom not found');
    }
    
    console.log('Current classroom data:', {
      name: classroom.name,
      description: classroom.description,
      yearLevelSection: classroom.yearLevelSection
    });
    
    if (data.name !== undefined) {
      console.log('Updating name from', classroom.name, 'to', data.name);
      classroom.name = data.name;
    }
    if (data.description !== undefined) {
      console.log('Updating description from', classroom.description, 'to', data.description);
      classroom.description = data.description;
    }
    if (data.yearLevelSection !== undefined) {
      console.log('Updating yearLevelSection from', classroom.yearLevelSection, 'to', data.yearLevelSection);
      classroom.yearLevelSection = data.yearLevelSection;
      classroom.markModified('yearLevelSection');
      console.log('yearLevelSection after assignment:', classroom.yearLevelSection);
      console.log('Is yearLevelSection modified?', classroom.isModified('yearLevelSection'));
    }
    if (data.settings) {
      classroom.settings = { ...classroom.settings, ...data.settings };
    }

    console.log('Updated classroom data before save:', {
      name: classroom.name,
      description: classroom.description,
      yearLevelSection: classroom.yearLevelSection
    });

    await classroom.save();
    console.log('Classroom saved successfully');
    
    // Re-fetch to verify
    const savedClassroom = await Classroom.findById(classroomId);
    console.log('Verified saved yearLevelSection:', savedClassroom.yearLevelSection);
    
    await classroom.populate('teacher', 'firstName middleInitial lastName email');
    await classroom.populate('students.studentId', 'firstName middleInitial lastName email');
    
    console.log('Returning updated classroom:', {
      name: classroom.name,
      description: classroom.description,
      yearLevelSection: classroom.yearLevelSection
    });
    
    return classroom;
  },

  async deleteClassroom(classroomId) {
    const classroom = await Classroom.findById(classroomId);
    classroom.isActive = false;
    await classroom.save();
    return classroom;
  },

  async joinClassroom(code, studentId) {
    const classroom = await Classroom.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!classroom) {
      throw new Error('Invalid classroom code');
    }

    const alreadyEnrolled = classroom.students.some(
      s => s.studentId.toString() === studentId
    );

    if (alreadyEnrolled) {
      throw new Error('You are already enrolled in this classroom');
    }

    await classroom.addStudent(studentId);
    await classroom.populate('teacher', 'firstName middleInitial lastName email');
    return classroom;
  },

  async removeStudent(classroomId, studentId) {
    const classroom = await Classroom.findById(classroomId);
    await classroom.removeStudent(studentId);
    return classroom;
  },

  async leaveClassroom(classroomId, studentId) {
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    const isEnrolled = classroom.students.some(
      s => s.studentId.toString() === studentId
    );

    if (!isEnrolled) {
      throw new Error('You are not enrolled in this classroom');
    }

    await classroom.removeStudent(studentId);
    return classroom;
  },

  async checkTeacherOwnership(classroomId, teacherId) {
    const classroom = await Classroom.findById(classroomId);
    return classroom && classroom.teacher.toString() === teacherId;
  },

  async checkUserAccess(classroomId, userId) {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return false;

    const isTeacher = classroom.teacher.toString() === userId;
    const isStudent = classroom.students.some(
      s => s.studentId.toString() === userId
    );

    return isTeacher || isStudent;
  }
};
