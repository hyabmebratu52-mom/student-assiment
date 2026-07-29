<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=assignment_system', 'root', '');

$expected = [
    'users', 'courses', 'course_student', 'groups', 'group_members',
    'assignments', 'submissions', 'grades',
    'announcements', 'submission_comments', 'rubric_criteria', 'rubric_scores',
    'user_notifications', 'personal_access_tokens', 'migrations'
];

$existing = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

echo "=== DATABASE TABLES ===\n";
$allOk = true;
foreach ($expected as $t) {
    $ok = in_array($t, $existing);
    echo ($ok ? "  ✓ " : "  ✗ MISSING: ") . $t . "\n";
    if (!$ok) $allOk = false;
}
echo "\n";

// Count rows
$counts = ['users', 'courses', 'assignments', 'submissions', 'grades'];
echo "=== ROW COUNTS ===\n";
foreach ($counts as $t) {
    $n = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    echo "  $t: $n\n";
}

echo "\n" . ($allOk ? "ALL TABLES OK ✓" : "SOME TABLES MISSING ✗") . "\n";
