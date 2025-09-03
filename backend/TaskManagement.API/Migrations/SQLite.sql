CREATE TABLE "AuditLogs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AuditLogs" PRIMARY KEY AUTOINCREMENT,
    "EntityType" TEXT NOT NULL,
    "EntityId" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "UserId" INTEGER NULL,
    "Summary" TEXT NOT NULL,
    "Details" TEXT NULL,
    "IpAddress" TEXT NULL,
    "UserAgent" TEXT NULL,
    "RequestPath" TEXT NULL,
    "HttpMethod" TEXT NULL,
    "ResponseStatusCode" INTEGER NULL,
    "ExecutionTimeMs" INTEGER NULL,
    "CreatedAt" TEXT NOT NULL,
    "Metadata" TEXT NULL
);

CREATE TABLE "Categories" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Categories" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Description" TEXT NULL,
    "Color" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

CREATE TABLE "Users" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Users" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "PhoneNumber" TEXT NULL,
    "Department" TEXT NULL,
    "UserRole" INTEGER NOT NULL,
    "AccountStatus" INTEGER NOT NULL,
    "LastLoginAt" TEXT NULL,
    "RefreshToken" TEXT NULL,
    "RefreshTokenExpiryTime" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

CREATE TABLE "Tasks" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Tasks" PRIMARY KEY AUTOINCREMENT,
    "Title" TEXT NOT NULL,
    "Description" TEXT NULL,
    "Status" INTEGER NOT NULL,
    "Priority" INTEGER NOT NULL,
    "DueDate" TEXT NULL,
    "CompletedAt" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "CategoryId" INTEGER NULL,
    "AssignedUserId" INTEGER NULL,
    CONSTRAINT "FK_Tasks_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Tasks_Users_AssignedUserId" FOREIGN KEY ("AssignedUserId") REFERENCES "Users" ("Id"),
    CONSTRAINT "FK_Tasks_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "TaskComments" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_TaskComments" PRIMARY KEY AUTOINCREMENT,
    "Content" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "TaskId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    CONSTRAINT "FK_TaskComments_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskComments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "TaskActivities" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_TaskActivities" PRIMARY KEY AUTOINCREMENT,
    "ActivityType" INTEGER NOT NULL,
    "Description" TEXT NULL,
    "OldValue" TEXT NULL,
    "NewValue" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "TaskId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    CONSTRAINT "FK_TaskActivities_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskActivities_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_AuditLogs_EntityType_EntityId" ON "AuditLogs" ("EntityType", "EntityId");
CREATE INDEX "IX_AuditLogs_UserId" ON "AuditLogs" ("UserId");
CREATE INDEX "IX_AuditLogs_Action" ON "AuditLogs" ("Action");
CREATE INDEX "IX_AuditLogs_CreatedAt" ON "AuditLogs" ("CreatedAt");
CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX "IX_Tasks_AssignedUserId" ON "Tasks" ("AssignedUserId");
CREATE INDEX "IX_Tasks_CategoryId" ON "Tasks" ("CategoryId");
CREATE INDEX "IX_Tasks_UserId" ON "Tasks" ("UserId");
CREATE INDEX "IX_TaskComments_TaskId" ON "TaskComments" ("TaskId");
CREATE INDEX "IX_TaskComments_UserId" ON "TaskComments" ("UserId");
CREATE INDEX "IX_TaskActivities_TaskId" ON "TaskActivities" ("TaskId");
CREATE INDEX "IX_TaskActivities_UserId" ON "TaskActivities" ("UserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250903140000_InitialCreate', '8.0.0');