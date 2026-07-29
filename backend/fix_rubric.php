<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=assignment_system', 'root', '');
$pdo->exec('SET FOREIGN_KEY_CHECKS=0');
$pdo->exec('DROP TABLE IF EXISTS rubric_scores');
$pdo->exec('DROP TABLE IF EXISTS rubric_criteria');
$pdo->exec("DELETE FROM migrations WHERE migration LIKE '%rubric%'");
$pdo->exec('SET FOREIGN_KEY_CHECKS=1');

// Re-create them correctly
$pdo->exec("CREATE TABLE rubric_criteria (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    max_score INT NOT NULL,
    `order` INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_rc_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE rubric_scores (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT UNSIGNED NOT NULL,
    rubric_criteria_id BIGINT UNSIGNED NOT NULL,
    score INT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY uq_sub_crit (submission_id, rubric_criteria_id),
    CONSTRAINT fk_rs_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_rs_criteria FOREIGN KEY (rubric_criteria_id) REFERENCES rubric_criteria(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

// Mark migration as done
$batch = $pdo->query("SELECT MAX(batch) FROM migrations")->fetchColumn();
$stmt = $pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
$stmt->execute(['2024_01_02_000003_create_rubric_criteria_table', $batch]);

echo "rubric_criteria and rubric_scores created.\n";
echo "migration record inserted.\n";
