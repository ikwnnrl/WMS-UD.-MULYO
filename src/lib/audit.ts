import prisma from '@/lib/prisma';

interface AuditUser {
    username: string;
    role: string;
}

export async function createAuditLog(
    action: string,
    entity: string,
    entityId: number | null,
    details: string | object,
    user: AuditUser
) {
    try {
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                actorName: user.username,
                actorRole: user.role,
                details: detailsStr
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't crash the main app if audit fails
    }
}
