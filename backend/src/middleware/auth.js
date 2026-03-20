const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token missing' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token', details: error });
    }

    req.user = user;
    next();
};

const requireAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: req.headers.authorization } } }
    );

    const { data: userData, error } = await userSupabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

    if (error || !userData || userData.role !== 'admin') {
        return res.status(403).json({ error: 'Admin privileges required' });
    }

    next();
};

module.exports = { requireAuth, requireAdmin };
