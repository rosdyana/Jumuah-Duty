-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `can_book_room` BOOLEAN NOT NULL DEFAULT false,
    `can_be_khatib` BOOLEAN NOT NULL DEFAULT false,
    `can_be_imam` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `fixed_room_booker_id` VARCHAR(191) NULL,
    `avoid_same_person_multiple_duties` BOOLEAN NOT NULL DEFAULT true,
    `reminder_enabled` BOOLEAN NOT NULL DEFAULT true,
    `reminder_days_before` INTEGER NOT NULL DEFAULT 1,
    `weekly_summary_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rotation_members` (
    `id` VARCHAR(191) NOT NULL,
    `duty_type` ENUM('ROOM_BOOKING', 'KHATIB', 'IMAM') NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `rotation_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rotation_members_duty_type_rotation_order_idx`(`duty_type`, `rotation_order`),
    UNIQUE INDEX `rotation_members_duty_type_user_id_key`(`duty_type`, `user_id`),
    UNIQUE INDEX `rotation_members_duty_type_rotation_order_key`(`duty_type`, `rotation_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rotation_state` (
    `id` VARCHAR(191) NOT NULL,
    `duty_type` ENUM('ROOM_BOOKING', 'KHATIB', 'IMAM') NOT NULL,
    `last_assigned_user_id` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rotation_state_duty_type_key`(`duty_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedules` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('UPCOMING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `schedules_date_key`(`date`),
    INDEX `schedules_status_date_idx`(`status`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `schedule_id` VARCHAR(191) NOT NULL,
    `duty_type` ENUM('ROOM_BOOKING', 'KHATIB', 'IMAM') NOT NULL,
    `assigned_user_id` VARCHAR(191) NULL,
    `original_user_id` VARCHAR(191) NULL,
    `assignment_type` ENUM('ROTATION', 'FIXED', 'REPLACEMENT', 'MANUAL') NOT NULL,
    `status` ENUM('ASSIGNED', 'REPLACEMENT_NEEDED', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `schedule_assignments_assigned_user_id_idx`(`assigned_user_id`),
    INDEX `schedule_assignments_status_idx`(`status`),
    UNIQUE INDEX `schedule_assignments_schedule_id_duty_type_key`(`schedule_id`, `duty_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unavailability_requests` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `schedule_id` VARCHAR(191) NOT NULL,
    `duty_type` ENUM('ROOM_BOOKING', 'KHATIB', 'IMAM') NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'RESOLVED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `unavailability_requests_user_id_idx`(`user_id`),
    INDEX `unavailability_requests_schedule_id_duty_type_idx`(`schedule_id`, `duty_type`),
    INDEX `unavailability_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schedule_id` VARCHAR(191) NOT NULL,
    `type` ENUM('H1_REMINDER', 'WEEKLY_SUMMARY') NOT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notification_logs_schedule_id_type_key`(`schedule_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `app_settings` ADD CONSTRAINT `app_settings_fixed_room_booker_id_fkey` FOREIGN KEY (`fixed_room_booker_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotation_members` ADD CONSTRAINT `rotation_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotation_state` ADD CONSTRAINT `rotation_state_last_assigned_user_id_fkey` FOREIGN KEY (`last_assigned_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_assignments` ADD CONSTRAINT `schedule_assignments_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_assignments` ADD CONSTRAINT `schedule_assignments_assigned_user_id_fkey` FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_assignments` ADD CONSTRAINT `schedule_assignments_original_user_id_fkey` FOREIGN KEY (`original_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unavailability_requests` ADD CONSTRAINT `unavailability_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unavailability_requests` ADD CONSTRAINT `unavailability_requests_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
