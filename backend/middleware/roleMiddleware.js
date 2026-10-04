export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Fallback-friendly check: supports req.userRole, req.user?.role, or req.role
        const rawRole = req.userRole || req.user?.role || req.role || '';
        const userRole = String(rawRole).trim().toLowerCase();
        
        const normalizedAllowed = allowedRoles.map(r => String(r).trim().toLowerCase());

        console.log(`[Auth Check] Route protected for: [${allowedRoles.join(', ')}] | Current user role found: "${rawRole}"`);

        if (!userRole || !normalizedAllowed.includes(userRole)) {
            return res.status(403).json({ 
                message: `Access denied: Role '${rawRole || 'None'}' is not authorized for this action.` 
            });
        }
        next();
    };
};