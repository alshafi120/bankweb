<?php

namespace Tests\Unit;

use App\Modules\Applications\Application\Services\ReferenceGenerator;
use Tests\TestCase;

class ReferenceGeneratorTest extends TestCase
{
    public function test_references_are_sequential_per_prefix_and_year(): void
    {
        $g = app(ReferenceGenerator::class);

        $this->assertSame('WTQ-FIN-2026-000001', $g->next('FIN', 2026));
        $this->assertSame('WTQ-FIN-2026-000002', $g->next('FIN', 2026));
        $this->assertSame('WTQ-ACC-2026-000001', $g->next('ACC', 2026));
        $this->assertSame('WTQ-FIN-2027-000001', $g->next('FIN', 2027));
        $this->assertSame('WTQ-FIN-2026-000003', $g->next('fin', 2026));
    }

    public function test_unknown_prefix_is_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(ReferenceGenerator::class)->next('XYZ');
    }

    public function test_fake_reference_has_the_same_format(): void
    {
        $this->assertMatchesRegularExpression('/^WTQ-CB-\d{4}-\d{6}$/', ReferenceGenerator::fake('CB'));
    }
}
