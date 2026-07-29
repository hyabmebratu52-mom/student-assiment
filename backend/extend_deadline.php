<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=assignment_system', 'root', '');

// Show current assignments
echo "=== ምደባዎች አሁን ===\n";
$assignments = $pdo->query("SELECT id, title, deadline, allow_late FROM assignments")->fetchAll(PDO::FETCH_ASSOC);
foreach ($assignments as $a) {
    $status = strtotime($a['deadline']) < time() ? '❌ ጊዜ አልፏል' : '✅ ክፍት';
    $late = $a['allow_late'] ? 'late OK' : 'no late';
    echo "  [{$a['id']}] {$a['title']}\n";
    echo "      deadline: {$a['deadline']} → $status | $late\n";
}

// Extend all past deadlines by 30 days + enable allow_late
$newDeadline = date('Y-m-d H:i:s', strtotime('+30 days'));
$pdo->exec("UPDATE assignments SET deadline = '$newDeadline', allow_late = 1 WHERE deadline < NOW()");

echo "\n✅ ጊዜ ያለፉ ምደባዎች 30 ቀን ተራዘሙ + ዘግይቶ ይቀበላሉ\n";

echo "\n=== ከተስተካከለ በኋላ ===\n";
$assignments = $pdo->query("SELECT id, title, deadline, allow_late FROM assignments")->fetchAll(PDO::FETCH_ASSOC);
foreach ($assignments as $a) {
    $status = strtotime($a['deadline']) < time() ? '❌ ጊዜ አልፏል' : '✅ ክፍት';
    $late = $a['allow_late'] ? 'late OK' : 'no late';
    echo "  [{$a['id']}] {$a['title']}\n";
    echo "      deadline: {$a['deadline']} → $status | $late\n";
}
