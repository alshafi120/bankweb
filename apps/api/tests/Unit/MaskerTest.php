<?php

namespace Tests\Unit;

use App\Support\Security\Masker;
use App\Support\Security\PiiHasher;
use Tests\TestCase;

class MaskerTest extends TestCase
{
    public function test_masks(): void
    {
        $this->assertSame('+967 7•• ••• 567', Masker::phone('+967771234567'));
        $this->assertSame('—', Masker::phone(null));
        $this->assertSame('••••••••5678', Masker::nationalId('012345675678'));
        $this->assertSame('pe••••@example.com', Masker::email('person@example.com'));
    }

    public function test_phone_hash_is_format_independent(): void
    {
        $this->assertSame(PiiHasher::phone('+967 77 123 4567'), PiiHasher::phone('771234567'));
        $this->assertNotSame(PiiHasher::phone('771234567'), PiiHasher::phone('771234568'));
    }
}
