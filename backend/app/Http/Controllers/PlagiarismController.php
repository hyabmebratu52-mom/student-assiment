<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Submission;
use Illuminate\Http\Request;

class PlagiarismController extends Controller
{
    /**
     * GET /assignments/{assignmentId}/plagiarism-check
     * Compare all text submissions for similarity
     */
    public function check(Request $request, $assignmentId)
    {
        $user       = $request->user();
        $assignment = Assignment::with('course')->findOrFail($assignmentId);

        if ($user->isStudent()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($user->isTeacher() && (int)$assignment->course->teacher_id !== (int)$user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Get all submissions with text content
        $submissions = Submission::where('assignment_id', $assignmentId)
            ->whereNotNull('content')
            ->where('content', '!=', '')
            ->with('student:id,name,student_id')
            ->get();

        if ($submissions->count() < 2) {
            return response()->json([
                'message' => 'ቢያንስ 2 text submissions ያስፈልጋሉ።',
                'results' => [],
            ]);
        }

        $results = [];

        // Compare each pair
        for ($i = 0; $i < $submissions->count(); $i++) {
            for ($j = $i + 1; $j < $submissions->count(); $j++) {
                $s1 = $submissions[$i];
                $s2 = $submissions[$j];

                $similarity = $this->calculateSimilarity(
                    $s1->content,
                    $s2->content
                );

                if ($similarity > 20) { // Only show if > 20% similar
                    $results[] = [
                        'student1' => [
                            'id'         => $s1->student?->id,
                            'name'       => $s1->student?->name,
                            'student_id' => $s1->student?->student_id,
                            'submission_id' => $s1->id,
                        ],
                        'student2' => [
                            'id'         => $s2->student?->id,
                            'name'       => $s2->student?->name,
                            'student_id' => $s2->student?->student_id,
                            'submission_id' => $s2->id,
                        ],
                        'similarity' => round($similarity, 1),
                        'risk_level' => $this->riskLevel($similarity),
                    ];
                }
            }
        }

        // Sort by similarity descending
        usort($results, fn($a, $b) => $b['similarity'] <=> $a['similarity']);

        return response()->json([
            'assignment'        => $assignment->title,
            'total_submissions' => $submissions->count(),
            'pairs_checked'     => ($submissions->count() * ($submissions->count() - 1)) / 2,
            'suspicious_pairs'  => count($results),
            'results'           => $results,
        ]);
    }

    /**
     * Calculate similarity between two texts using multiple methods
     */
    private function calculateSimilarity(string $text1, string $text2): float
    {
        if (empty($text1) || empty($text2)) return 0;

        // Normalize texts
        $t1 = $this->normalize($text1);
        $t2 = $this->normalize($text2);

        if ($t1 === $t2) return 100;

        // Method 1: similar_text PHP built-in
        similar_text($t1, $t2, $percent1);

        // Method 2: Jaccard similarity (word-level)
        $words1 = array_unique(explode(' ', $t1));
        $words2 = array_unique(explode(' ', $t2));

        $intersection = array_intersect($words1, $words2);
        $union        = array_unique(array_merge($words1, $words2));

        $jaccard = count($union) > 0
            ? (count($intersection) / count($union)) * 100
            : 0;

        // Method 3: N-gram similarity (3-gram)
        $ngram = $this->ngramSimilarity($t1, $t2, 3);

        // Weighted average
        $score = ($percent1 * 0.4) + ($jaccard * 0.3) + ($ngram * 0.3);

        return min(100, $score);
    }

    private function normalize(string $text): string
    {
        $text = strtolower($text);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = preg_replace('/[^\w\s]/', '', $text);
        return trim($text);
    }

    private function ngramSimilarity(string $t1, string $t2, int $n): float
    {
        $ngrams1 = $this->getNgrams($t1, $n);
        $ngrams2 = $this->getNgrams($t2, $n);

        if (empty($ngrams1) || empty($ngrams2)) return 0;

        $intersection = array_intersect($ngrams1, $ngrams2);
        $union        = array_unique(array_merge($ngrams1, $ngrams2));

        return count($union) > 0
            ? (count($intersection) / count($union)) * 100
            : 0;
    }

    private function getNgrams(string $text, int $n): array
    {
        $words  = explode(' ', $text);
        $ngrams = [];
        for ($i = 0; $i <= count($words) - $n; $i++) {
            $ngrams[] = implode(' ', array_slice($words, $i, $n));
        }
        return $ngrams;
    }

    private function riskLevel(float $similarity): string
    {
        if ($similarity >= 80) return 'ከፍተኛ ስጋት';
        if ($similarity >= 50) return 'መካከለኛ ስጋት';
        if ($similarity >= 20) return 'ዝቅተኛ ስጋት';
        return 'ምንም ስጋት የለም';
    }
}
