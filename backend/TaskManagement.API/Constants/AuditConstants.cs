namespace TaskManagement.API.Constants
{
    /// <summary>
    /// Constants for audit entity types
    /// </summary>
    public static class AuditEntities
    {
        public const string TASK = "Task";
        public const string USER = "User";
        public const string CATEGORY = "Category";
        public const string COMMENT = "Comment";
        public const string ACTIVITY = "Activity";
        public const string AUTHENTICATION = "Authentication";
        public const string SYSTEM = "System";
    }

    /// <summary>
    /// Constants for audit action types
    /// </summary>
    public static class AuditActions
    {
        public const string CREATE = "Create";
        public const string UPDATE = "Update";
        public const string DELETE = "Delete";
        public const string VIEW = "View";
        public const string LOGIN = "Login";
        public const string LOGOUT = "Logout";
        public const string REGISTER = "Register";
        public const string PASSWORD_CHANGE = "PasswordChange";
        public const string PASSWORD_RESET = "PasswordReset";
        public const string ACCESS_DENIED = "AccessDenied";
        public const string BULK_DELETE = "BulkDelete";
        public const string BULK_UPDATE = "BulkUpdate";
        public const string EXPORT = "Export";
        public const string IMPORT = "Import";
    }
}