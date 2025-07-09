#!/usr/bin/env python3
"""
Script to create test data for teacher-student-subject relationships
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'BrainInk-Backend', 'users_micro'))

def create_test_relationships():
    """Create test relationships between teachers, students, and subjects"""
    try:
        from sqlalchemy.orm import sessionmaker
        from db.connection import engine
        from models.study_area_models import (
            Teacher, Student, Subject, User, School,
            subject_teachers, subject_students
        )
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("🔧 Creating Test Relationships...")
        print("=" * 50)
        
        # Get first teacher
        teacher = db.query(Teacher).filter(Teacher.is_active == True).first()
        if not teacher:
            print("❌ No active teachers found. Please create a teacher first.")
            return
            
        teacher_user = db.query(User).filter(User.id == teacher.user_id).first()
        print(f"👨‍🏫 Using teacher: {teacher_user.fname} {teacher_user.lname} (ID: {teacher.id})")
        
        # Get subjects in the same school
        subjects = db.query(Subject).filter(
            Subject.school_id == teacher.school_id,
            Subject.is_active == True
        ).all()
        
        if not subjects:
            print("❌ No subjects found in teacher's school. Creating some...")
            
            # Create test subjects
            test_subjects = [
                {"name": "English grade 12", "description": "Grade 12 English Literature"},
                {"name": "Mathematics", "description": "Advanced Mathematics"},
                {"name": "Science", "description": "General Science"}
            ]
            
            for subject_data in test_subjects:
                subject = Subject(
                    name=subject_data["name"],
                    description=subject_data["description"],
                    school_id=teacher.school_id,
                    teacher_id=teacher.id,  # Direct assignment
                    created_by=teacher.user_id,
                    is_active=True
                )
                db.add(subject)
                subjects.append(subject)
            
            db.commit()
            print(f"✅ Created {len(test_subjects)} test subjects")
        
        print(f"📚 Found {len(subjects)} subjects in school")
        
        # Assign teacher to subjects (many-to-many)
        for subject in subjects:
            # Check if relationship already exists
            existing = db.query(subject_teachers).filter(
                subject_teachers.c.teacher_id == teacher.id,
                subject_teachers.c.subject_id == subject.id
            ).first()
            
            if not existing:
                # Create the relationship
                stmt = subject_teachers.insert().values(
                    teacher_id=teacher.id,
                    subject_id=subject.id
                )
                db.execute(stmt)
                print(f"   ✅ Assigned teacher to subject: {subject.name}")
            else:
                print(f"   ➡️  Teacher already assigned to: {subject.name}")
        
        # Get students in the same school
        students = db.query(Student).filter(
            Student.school_id == teacher.school_id,
            Student.is_active == True
        ).all()
        
        if not students:
            print("❌ No students found in teacher's school.")
            print("   Please create some students first or check the database.")
            db.close()
            return
        
        print(f"👥 Found {len(students)} students in school")
        
        # Assign students to subjects (many-to-many)
        for student in students:
            student_user = db.query(User).filter(User.id == student.user_id).first()
            print(f"   👦 Processing student: {student_user.fname} {student_user.lname}")
            
            # Assign student to first 2 subjects
            for subject in subjects[:2]:
                # Check if relationship already exists
                existing = db.query(subject_students).filter(
                    subject_students.c.student_id == student.id,
                    subject_students.c.subject_id == subject.id
                ).first()
                
                if not existing:
                    # Create the relationship
                    stmt = subject_students.insert().values(
                        student_id=student.id,
                        subject_id=subject.id
                    )
                    db.execute(stmt)
                    print(f"     ✅ Enrolled in: {subject.name}")
                else:
                    print(f"     ➡️  Already enrolled in: {subject.name}")
        
        # Commit all changes
        db.commit()
        print("\n✅ Test relationships created successfully!")
        
        # Verify the relationships
        print("\n🔍 Verification:")
        subjects_with_teacher = db.query(Subject).join(
            subject_teachers, Subject.id == subject_teachers.c.subject_id
        ).filter(
            subject_teachers.c.teacher_id == teacher.id
        ).count()
        
        students_with_subjects = db.query(Student).join(
            subject_students, Student.id == subject_students.c.student_id
        ).join(
            Subject, Subject.id == subject_students.c.subject_id
        ).join(
            subject_teachers, Subject.id == subject_teachers.c.subject_id
        ).filter(
            subject_teachers.c.teacher_id == teacher.id
        ).distinct().count()
        
        print(f"   Teacher teaches {subjects_with_teacher} subjects")
        print(f"   Teacher has {students_with_subjects} students across all subjects")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error creating test relationships: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_relationships()
