<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=assignment_system', 'root', '');

echo "=== USERS ===\n";
$users = $pdo->query("SELECT id, name, email, role FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) echo "  [{$u['id']}] {$u['name']} ({$u['role']}) - {$u['email']}\n";

echo "\n=== COURSES ===\n";
$courses = $pdo->query("SELECT id, title, code FROM courses")->fetchAll(PDO::FETCH_ASSOC);
foreach ($courses as $c) echo "  [{$c['id']}] {$c['code']} - {$c['title']}\n";

echo "\n=== ASSIGNMENTS ===\n";
$asgn = $pdo->query("SELECT id, title, course_id, type, deadline FROM assignments")->fetchAll(PDO::FETCH_ASSOC);
foreach ($asgn as $a) echo "  [{$a['id']}] Course#{$a['course_id']} - {$a['title']} ({$a['type']}) deadline:{$a['deadline']}\n";

echo "\n=== ENROLLMENTS (course_student) ===\n";
$enroll = $pdo->query("SELECT cs.course_id, cs.user_id, u.name, c.code 
    FROM course_student cs 
    JOIN users u ON u.id = cs.user_id 
    JOIN courses c ON c.id = cs.course_id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($enroll as $e) echo "  {$e['name']} enrolled in {$e['code']} (course_id:{$e['course_id']})\n";

echo "\n=== SUBMISSIONS ===\n";
$subs = $pdo->query("SELECT COUNT(*) as cnt FROM submissions")->fetchColumn();
echo "  Total: $subs\n";
