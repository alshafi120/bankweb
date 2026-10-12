<?php

namespace App\Modules\Audit\Domain\Enums;

/** Contract `AuditLogEntry.action`. */
enum AuditAction: string
{
    case Login = 'login';
    case Logout = 'logout';
    case LoginFailed = 'login_failed';
    case Create = 'create';
    case Update = 'update';
    case Delete = 'delete';
    case Publish = 'publish';
    case Approve = 'approve';
    case Reject = 'reject';
    case ChangePermissions = 'change_permissions';
    case Export = 'export';
    case Lockout = 'lockout';
}
