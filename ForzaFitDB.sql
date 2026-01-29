DROP DATABASE IF EXISTS `forzafit`;
CREATE DATABASE `forzafit`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE `forzafit`;

-- USERS
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- PLANS
DROP TABLE IF EXISTS `plans`;
CREATE TABLE `plans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plans_user_id` (`user_id`),
  CONSTRAINT `fk_plans_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- EXERCISES
DROP TABLE IF EXISTS `exercises`;
CREATE TABLE `exercises` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `muscle_group` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_exercises_plan_id` (`plan_id`),
  CONSTRAINT `fk_exercises_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- PLAN_SETS
DROP TABLE IF EXISTS `plan_sets`;
CREATE TABLE `plan_sets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `exercise_id` INT UNSIGNED NOT NULL,
  `set_number` INT UNSIGNED NOT NULL,
  `weight` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `reps` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_plan_sets_exercise_id` (`exercise_id`),
  CONSTRAINT `fk_plan_sets_exercise`
    FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- WORKOUTS
DROP TABLE IF EXISTS `workouts`;
CREATE TABLE `workouts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NULL,
  `total_duration_minutes` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_workouts_user_id` (`user_id`),
  KEY `idx_workouts_plan_id` (`plan_id`),
  CONSTRAINT `fk_workouts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_workouts_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- WORKOUT_SETS
DROP TABLE IF EXISTS `workout_sets`;
CREATE TABLE `workout_sets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workout_id` INT UNSIGNED NOT NULL,
  `exercise_id` INT UNSIGNED NOT NULL,
  `set_number` INT UNSIGNED NOT NULL,
  `weight` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `reps` INT UNSIGNED NOT NULL DEFAULT 0,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_workout_sets_workout_id` (`workout_id`),
  KEY `idx_workout_sets_exercise_id` (`exercise_id`),
  CONSTRAINT `fk_workout_sets_workout`
    FOREIGN KEY (`workout_id`) REFERENCES `workouts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_workout_sets_exercise`
    FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
