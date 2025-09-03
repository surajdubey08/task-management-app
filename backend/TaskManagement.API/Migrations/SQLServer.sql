CREATE TABLE [AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [EntityType] nvarchar(100) NOT NULL,
    [EntityId] nvarchar(max) NOT NULL,
    [Action] nvarchar(50) NOT NULL,
    [UserId] int NULL,
    [Summary] nvarchar(500) NOT NULL,
    [Details] ntext NULL,
    [IpAddress] nvarchar(45) NULL,
    [UserAgent] nvarchar(500) NULL,
    [RequestPath] nvarchar(200) NULL,
    [HttpMethod] nvarchar(10) NULL,
    [ResponseStatusCode] int NULL,
    [ExecutionTimeMs] bigint NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [Metadata] ntext NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE TABLE [Categories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [Color] nvarchar(7) NOT NULL DEFAULT '#007bff',
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Email] nvarchar(255) NOT NULL,
    [PasswordHash] nvarchar(255) NOT NULL,
    [PhoneNumber] nvarchar(20) NULL,
    [Department] nvarchar(100) NULL,
    [UserRole] int NOT NULL DEFAULT 2,
    [AccountStatus] int NOT NULL DEFAULT 0,
    [LastLoginAt] datetime2 NULL,
    [RefreshToken] nvarchar(255) NULL,
    [RefreshTokenExpiryTime] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [Tasks] (
    [Id] int NOT NULL IDENTITY,
    [Title] nvarchar(200) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [Status] int NOT NULL DEFAULT 0,
    [Priority] int NOT NULL DEFAULT 1,
    [DueDate] datetime2 NULL,
    [CompletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UserId] int NOT NULL,
    [CategoryId] int NULL,
    [AssignedUserId] int NULL,
    CONSTRAINT [PK_Tasks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Tasks_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Tasks_Users_AssignedUserId] FOREIGN KEY ([AssignedUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Tasks_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [TaskComments] (
    [Id] int NOT NULL IDENTITY,
    [Content] nvarchar(2000) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [TaskId] int NOT NULL,
    [UserId] int NOT NULL,
    CONSTRAINT [PK_TaskComments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TaskComments_Tasks_TaskId] FOREIGN KEY ([TaskId]) REFERENCES [Tasks] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_TaskComments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE RESTRICT
);

CREATE TABLE [TaskActivities] (
    [Id] int NOT NULL IDENTITY,
    [ActivityType] int NOT NULL,
    [Description] nvarchar(500) NULL,
    [OldValue] nvarchar(100) NULL,
    [NewValue] nvarchar(100) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [TaskId] int NOT NULL,
    [UserId] int NOT NULL,
    CONSTRAINT [PK_TaskActivities] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TaskActivities_Tasks_TaskId] FOREIGN KEY ([TaskId]) REFERENCES [Tasks] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_TaskActivities_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE RESTRICT
);

CREATE INDEX [IX_AuditLogs_EntityType_EntityId] ON [AuditLogs] ([EntityType], [EntityId]);
CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]);
CREATE INDEX [IX_AuditLogs_Action] ON [AuditLogs] ([Action]);
CREATE INDEX [IX_AuditLogs_CreatedAt] ON [AuditLogs] ([CreatedAt]);
CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
CREATE INDEX [IX_Tasks_AssignedUserId] ON [Tasks] ([AssignedUserId]);
CREATE INDEX [IX_Tasks_CategoryId] ON [Tasks] ([CategoryId]);
CREATE INDEX [IX_Tasks_UserId] ON [Tasks] ([UserId]);
CREATE INDEX [IX_TaskComments_TaskId] ON [TaskComments] ([TaskId]);
CREATE INDEX [IX_TaskComments_UserId] ON [TaskComments] ([UserId]);
CREATE INDEX [IX_TaskActivities_TaskId] ON [TaskActivities] ([TaskId]);
CREATE INDEX [IX_TaskActivities_UserId] ON [TaskActivities] ([UserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250903140000_InitialCreate', N'8.0.0');