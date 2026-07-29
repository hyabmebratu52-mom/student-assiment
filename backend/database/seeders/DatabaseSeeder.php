<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Admin
        $admin = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@school.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);

        // Teachers
        $teacher1 = User::create([
            'name'     => 'Dr. Abebe Girma',
            'email'    => 'abebe@school.com',
            'password' => Hash::make('password'),
            'role'     => 'teacher',
        ]);

        $teacher2 = User::create([
            'name'     => 'Ato Kebede Haile',
            'email'    => 'kebede@school.com',
            'password' => Hash::make('password'),
            'role'     => 'teacher',
        ]);

        // Students
        $students = [];
        $studentData = [
            ['Tigist Alemu', 'tigist@student.com', 'STU001'],
            ['Dawit Tesfaye', 'dawit@student.com', 'STU002'],
            ['Meron Bekele', 'meron@student.com', 'STU003'],
            ['Yonas Tadesse', 'yonas@student.com', 'STU004'],
            ['Hana Worku', 'hana@student.com', 'STU005'],
        ];

        foreach ($studentData as [$name, $email, $sid]) {
            $students[] = User::create([
                'name'       => $name,
                'email'      => $email,
                'password'   => Hash::make('password'),
                'role'       => 'student',
                'student_id' => $sid,
            ]);
        }

        // Courses
        $course1 = Course::create([
            'title'       => 'Introduction to Programming',
            'code'        => 'CS101',
            'description' => 'Fundamentals of programming using Python.',
            'teacher_id'  => $teacher1->id,
        ]);

        $course2 = Course::create([
            'title'       => 'Data Structures and Algorithms',
            'code'        => 'CS201',
            'description' => 'Core data structures and algorithm design.',
            'teacher_id'  => $teacher1->id,
        ]);

        $course3 = Course::create([
            'title'       => 'Database Systems',
            'code'        => 'DB301',
            'description' => 'Relational databases, SQL, and NoSQL.',
            'teacher_id'  => $teacher2->id,
        ]);

        // Enroll students
        foreach ($students as $student) {
            $student->enrolledCourses()->attach([$course1->id, $course2->id]);
        }
        $students[0]->enrolledCourses()->attach($course3->id);
        $students[1]->enrolledCourses()->attach($course3->id);

        // Assignments
        Assignment::create([
            'title'       => 'Python Basics Exercise',
            'description' => 'Write a Python script that calculates factorial recursively.',
            'course_id'   => $course1->id,
            'created_by'  => $teacher1->id,
            'type'        => 'individual',
            'deadline'    => Carbon::now()->addDays(7),
            'max_score'   => 100,
        ]);

        Assignment::create([
            'title'       => 'Group Project: Simple Calculator',
            'description' => 'Build a calculator application as a group.',
            'course_id'   => $course1->id,
            'created_by'  => $teacher1->id,
            'type'        => 'group',
            'deadline'    => Carbon::now()->addDays(14),
            'allow_late'  => true,
            'max_score'   => 100,
        ]);

        Assignment::create([
            'title'       => 'Linked List Implementation',
            'description' => 'Implement a singly linked list with insert, delete, and search.',
            'course_id'   => $course2->id,
            'created_by'  => $teacher1->id,
            'type'        => 'individual',
            'deadline'    => Carbon::now()->addDays(5),
            'max_score'   => 80,
        ]);

        Assignment::create([
            'title'       => 'SQL Query Design',
            'description' => 'Design and execute 10 complex SQL queries on the provided schema.',
            'course_id'   => $course3->id,
            'created_by'  => $teacher2->id,
            'type'        => 'individual',
            'deadline'    => Carbon::now()->subDay(), // past deadline
            'allow_late'  => false,
            'max_score'   => 50,
        ]);
    }
}
