#!/usr/bin/env python3
"""
Test script to check database relationships for teachers, students, and subjects
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'BrainInk-Backend', 'users_micro'))

def test_database_relationships():
    """Test the database relationships"""
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
        
        print("🔍 Testing Database Relationships...")
        print("=" * 50)
        
        # Test 1: Check teachers
        teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        print(f"📚 Found {len(teachers)} active teachers")
        
        for teacher in teachers:
            user = db.query(User).filter(User.id == teacher.user_id).first()
            school = db.query(School).filter(School.id == teacher.school_id).first()
            
            print(f"\n👨‍🏫 Teacher ID: {teacher.id}")
            print(f"   User: {user.fname} {user.lname} ({user.email})" if user else "   User: Not found")
            print(f"   School: {school.name}" if school else "   School: Not found")
            
            # Check subjects taught by this teacher (many-to-many)
            try:
                subjects_m2m = db.query(Subject).join(
                    subject_teachers, Subject.id == subject_teachers.c.subject_id
                ).filter(
                    subject_teachers.c.teacher_id == teacher.id,
                    Subject.is_active == True
                ).all()
                print(f"   Subjects (many-to-many): {len(subjects_m2m)}")
                for subject in subjects_m2m:
                    print(f"     - {subject.name}")
            except Exception as e:
                print(f"   Subjects (many-to-many): Error - {e}")
            
            # Check subjects by direct teacher_id (fallback)
            subjects_direct = db.query(Subject).filter(
                Subject.teacher_id == teacher.id,
                Subject.is_active == True
            ).all()
            print(f"   Subjects (direct): {len(subjects_direct)}")
            for subject in subjects_direct:
                print(f"     - {subject.name}")
        
        print("\n" + "=" * 50)
        
        # Test 2: Check students
        students = db.query(Student).filter(Student.is_active == True).all()
        print(f"👥 Found {len(students)} active students")
        
        for i, student in enumerate(students[:5]):  # Limit to first 5
            user = db.query(User).filter(User.id == student.user_id).first()
            school = db.query(School).filter(School.id == student.school_id).first()
            
            print(f"\n👦 Student ID: {student.id}")
            print(f"   User: {user.fname} {user.lname} ({user.email})" if user else "   User: Not found")
            print(f"   School: {school.name}" if school else "   School: Not found")
            print(f"   Classroom ID: {student.classroom_id}")
            
            # Check subjects enrolled (many-to-many)
            try:
                subjects_enrolled = db.query(Subject).join(
                    subject_students, Subject.id == subject_students.c.subject_id
                ).filter(
                    subject_students.c.student_id == student.id,
                    Subject.is_active == True
                ).all()
                print(f"   Enrolled subjects: {len(subjects_enrolled)}")
                for subject in subjects_enrolled:
                    print(f"     - {subject.name}")
            except Exception as e:
                print(f"   Enrolled subjects: Error - {e}")
        
        if len(students) > 5:
            print(f"   ... and {len(students) - 5} more students")
        
        print("\n" + "=" * 50)
        
        # Test 3: Check subject-teacher relationships
        try:
            relationships = db.query(subject_teachers).all()
            print(f"🔗 Found {len(relationships)} subject-teacher relationships")
            
            for rel in relationships[:10]:  # Limit to first 10
                subject = db.query(Subject).filter(Subject.id == rel.subject_id).first()
                teacher = db.query(Teacher).filter(Teacher.id == rel.teacher_id).first()
                teacher_user = db.query(User).filter(User.id == teacher.user_id).first() if teacher else None
                
                print(f"   Subject: {subject.name if subject else 'Unknown'} -> Teacher: {teacher_user.fname + ' ' + teacher_user.lname if teacher_user else 'Unknown'}")
                
        except Exception as e:
            print(f"🔗 Subject-teacher relationships: Error - {e}")
        
        print("\n" + "=" * 50)
        
        # Test 4: Check subject-student relationships
        try:
            relationships = db.query(subject_students).all()
            print(f"🎓 Found {len(relationships)} subject-student relationships")
            
            for rel in relationships[:10]:  # Limit to first 10
                subject = db.query(Subject).filter(Subject.id == rel.subject_id).first()
                student = db.query(Student).filter(Student.id == rel.student_id).first()
                student_user = db.query(User).filter(User.id == student.user_id).first() if student else None
                
                print(f"   Subject: {subject.name if subject else 'Unknown'} -> Student: {student_user.fname + ' ' + student_user.lname if student_user else 'Unknown'}")
                
        except Exception as e:
            print(f"🎓 Subject-student relationships: Error - {e}")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print("Make sure the backend database is running and accessible.")

if __name__ == "__main__":
    test_database_relationships()
