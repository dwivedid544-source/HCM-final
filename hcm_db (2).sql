-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 31, 2026 at 03:03 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hcm_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `ailog`
--

CREATE TABLE `ailog` (
  `id` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `aimodule`
--

CREATE TABLE `aimodule` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `desc` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `confidence` int(11) NOT NULL DEFAULT 90,
  `settings` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcement`
--

CREATE TABLE `announcement` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `date` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `priority` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcement`
--

INSERT INTO `announcement` (`id`, `title`, `date`, `category`, `priority`, `content`, `createdAt`, `updatedAt`) VALUES
('791ec657-dbc0-4bfc-82b0-78492d3fae34', 'New Health Insurance Policy', 'Oct 22', 'Updates', 'medium', 'Our health insurance provider has been updated to Blue Cross Premium. Please review the new policy documents in the Benefits section for details on coverage and benefits.', '2026-08-22 06:39:46.159', '2026-08-22 06:39:46.159'),
('ccf3fc8d-ef1d-49db-92a3-18febc38da9d', 'WFH Policy Update', 'Oct 15', 'HR', 'low', 'Starting next month, our flexible work policy will allow for up to 3 days of remote work per week. Please coordinate with your manager for scheduling.', '2026-08-22 06:39:46.159', '2026-08-22 06:39:46.159'),
('ea3283f1-cfeb-49b0-957d-3b9fcbb17d31', 'Annual Team Building Retreat', 'Oct 28', 'Events', 'high', 'We are excited to announce our annual team building retreat! Join us for a weekend of fun, collaboration, and networking at the Mountain Resort. Transportation and accommodation will be provided.', '2026-08-22 06:39:46.159', '2026-08-22 06:39:46.159');

-- --------------------------------------------------------

--
-- Table structure for table `approvallog`
--

CREATE TABLE `approvallog` (
  `id` varchar(191) NOT NULL,
  `entityId` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `workflowId` varchar(191) DEFAULT NULL,
  `workflowVersion` int(11) DEFAULT NULL,
  `stepOrder` int(11) NOT NULL,
  `previousStep` int(11) DEFAULT NULL,
  `nextStep` int(11) DEFAULT NULL,
  `approverId` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `comments` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approvalstep`
--

CREATE TABLE `approvalstep` (
  `id` varchar(191) NOT NULL,
  `workflowId` varchar(191) NOT NULL,
  `stepOrder` int(11) NOT NULL,
  `sequence` int(11) NOT NULL DEFAULT 0,
  `approverType` varchar(191) NOT NULL DEFAULT 'ROLE',
  `approverRole` varchar(191) NOT NULL,
  `isRequired` tinyint(1) NOT NULL DEFAULT 1,
  `canSkip` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approvalworkflow`
--

CREATE TABLE `approvalworkflow` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `effectiveDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendancelog`
--

CREATE TABLE `attendancelog` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `clockIn` datetime(3) NOT NULL,
  `clockOut` datetime(3) DEFAULT NULL,
  `totalWorkedMin` int(11) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'Present',
  `mode` varchar(191) NOT NULL DEFAULT 'Office',
  `shiftId` varchar(191) DEFAULT NULL,
  `lateMinutes` int(11) NOT NULL DEFAULT 0,
  `earlyExitMinutes` int(11) NOT NULL DEFAULT 0,
  `overtimeMinutes` int(11) NOT NULL DEFAULT 0,
  `breakMinutes` int(11) NOT NULL DEFAULT 0,
  `isHalfDay` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendancelog`
--

INSERT INTO `attendancelog` (`id`, `userId`, `date`, `clockIn`, `clockOut`, `totalWorkedMin`, `status`, `mode`, `shiftId`, `lateMinutes`, `earlyExitMinutes`, `overtimeMinutes`, `breakMinutes`, `isHalfDay`, `createdAt`) VALUES
('70052c57-6e5c-41dc-81eb-4ae92a588038', 'c1017bd6-5cae-458f-a430-439127049325', '2026-08-22', '2026-08-22 02:39:46.143', '2026-08-22 06:39:46.143', 0, 'Present', 'Office', NULL, 0, 0, 0, 0, 0, '2026-08-22 06:39:46.143');

-- --------------------------------------------------------

--
-- Table structure for table `attendancepolicy`
--

CREATE TABLE `attendancepolicy` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `lateMarkThresholdMin` int(11) NOT NULL DEFAULT 15,
  `lateMarksForHalfDay` int(11) NOT NULL DEFAULT 3,
  `earlyExitThresholdMin` int(11) NOT NULL DEFAULT 15,
  `earlyExitsForHalfDay` int(11) NOT NULL DEFAULT 3,
  `halfDayWorkMin` int(11) NOT NULL DEFAULT 240,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auditlog`
--

CREATE TABLE `auditlog` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `details` text NOT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auditlog`
--

INSERT INTO `auditlog` (`id`, `userId`, `action`, `details`, `ipAddress`, `createdAt`, `organizationId`) VALUES
('018b9c21-5030-447a-863d-5e235cb8204c', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:04:44.746', NULL),
('01df31da-e7cb-4650-8d1c-d6d248f839cd', 'f5d4f385-ca0b-46ec-902d-9b2157f5d0db', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:59:10.220', NULL),
('03873ca6-eae0-4fc8-9cdf-afaac26d0848', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:50:07.934', NULL),
('0b2c969a-46b5-4729-8f78-e006f95df5a4', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 06:50:48.586', NULL),
('0c05b4a4-a434-4338-9af0-22a5b97bd79e', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:50:47.364', NULL),
('0d1c8b9b-67aa-4a7d-8d84-83a1395e7f50', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DELETE_PRICING_PLAN', 'Deleted pricing plan: 12', '::1', '2026-08-31 09:34:36.682', NULL),
('1223969b-ad07-49ad-8907-41cf6684bfb3', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 09:24:02.953', NULL),
('12678318-1a4f-4fa6-a134-2381e08b8cc0', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 10:09:23.596', NULL),
('14d7b893-4b37-4b4e-a82d-12db6f359609', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:33:32.479', NULL),
('176cba41-ca75-4561-b082-0730d3122866', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:12:30.100', NULL),
('17d613f7-12c6-4bf0-aba9-fd9a30473555', '414c1f97-53f2-4e9d-b021-52eaaabc764d', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:50:08.090', NULL),
('17e3d47b-1f0e-406a-a1fd-b45335c7166e', '6befaf96-f142-4aba-b096-4c40875b2318', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 05:58:09.293', NULL),
('19dffab9-ee5f-49aa-af43-b49a68126144', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:31:06.733', NULL),
('1b261bcb-27da-4f25-abd3-a35798e39122', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 08:42:10.106', NULL),
('1b278aa4-e397-4f32-82e5-1ef1ad947af9', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 10:19:15.370', NULL),
('1bf0439b-7c69-40e7-8569-4c6e6ce84de7', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 09:18:53.289', NULL),
('1f9feee3-bc4b-4eae-87b2-448e58f12c99', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 08:48:28.491', NULL),
('214e4618-8558-4232-a51a-869021ac76c4', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:10:23.883', NULL),
('21c07a4b-693c-442c-806a-fa12dc84e78c', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 09:03:17.177', NULL),
('22df2bae-643e-4aa0-a8da-72bbceab37b3', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DELETE_PRICING_PLAN', 'Deleted pricing plan: HIGH DEMANDED', '::1', '2026-08-31 11:33:14.367', NULL),
('236af6ed-a891-487c-be40-e01c84be0c6e', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DELETE_USER', 'Deleted user: nishantsolanki3107@gmail.com (ADMIN)', '::1', '2026-08-31 12:43:00.919', NULL),
('2702ac57-1393-4698-b4c7-9fdb119ddb25', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'CREATE_PRICING_PLAN', 'Created pricing plan: high demanded plan', '::1', '2026-08-31 11:34:04.564', NULL),
('28f69853-54ee-4ccc-a754-dcf303394949', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 09:15:59.339', NULL),
('294f1c71-d3d8-414a-8c4b-072325994e78', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'CREATE_PRICING_PLAN', 'Created pricing plan: nnnnnnnnnnnnnnn', '::1', '2026-08-31 09:27:34.986', NULL),
('2956651f-51fe-4156-af17-dcc85c47269e', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:51:16.240', NULL),
('2c082ccf-0a95-4419-bbf2-d55b1b3c4343', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 09:02:44.382', NULL),
('2c6083c6-3140-43fa-b0c4-f32d8bd968b8', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:18:26.301', NULL),
('2eeebb3d-8902-455f-a173-06abe0e353d6', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 09:03:36.072', NULL),
('315fdfe7-7eb2-48d2-bdc1-79780df6a435', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:46:38.582', NULL),
('31681304-bb4f-42d7-aed9-da96d51e9d46', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 09:47:09.111', NULL),
('31c8bb2e-eb17-4be5-93ec-734d9172bb64', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 10:00:24.087', NULL),
('34a74914-090e-42b2-aa18-566ee639f3f3', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:53:39.246', NULL),
('36567d43-3d68-4211-a015-537911da111e', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:17:09.270', NULL),
('3858ac31-70e5-43a2-b13e-d6a875cae716', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 08:47:51.190', NULL),
('38759554-13e4-4dd0-bb92-b8c47e13f8c5', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:49:32.877', NULL),
('39c460be-59b4-4080-888b-c9d08f5390ea', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 07:32:46.696', NULL),
('3ad41141-059f-4772-85ad-290eec82869e', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 07:50:16.667', NULL),
('3f35a9b8-4a7b-4f8f-8f4a-feb12a67bac1', '6befaf96-f142-4aba-b096-4c40875b2318', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 05:59:24.525', NULL),
('3fd99533-1bc1-426e-aa7b-25c43c8a6900', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 09:04:59.474', NULL),
('40407bcb-057d-4c68-ae7c-41c8c1f05a37', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 09:48:39.472', NULL),
('4084894e-9305-4368-aeed-9616d0862d48', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 07:42:05.723', NULL),
('441fc36e-aa4f-489c-b2cd-f3c27673be8a', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'PROVISION_ORGANIZATION', 'Provisioned organization \"wearit global  pvt .ltd\" with admin \"ramchandra@gmail.com\" on plan \"Professional\"', '::1', '2026-08-31 11:51:38.209', NULL),
('44292611-e578-488c-ada5-4300fdbd37d1', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 13:52:54.663', NULL),
('4cf196a4-e88a-455e-955f-d2bc8e1945d9', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 14:29:30.224', NULL),
('50f6dd7b-93f0-40fa-851c-89b0d99ed1a5', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'UPDATE_PRICING_PLAN', 'Updated pricing plan: HIGH DEMANDED', '::1', '2026-08-31 09:36:15.655', NULL),
('5199ed31-4c1c-42fe-b11e-eb5b6a966327', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 08:41:56.778', NULL),
('52c8cf88-1be8-4f4c-be44-ed807ef6738f', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 10:11:41.064', NULL),
('543e7d56-b543-4faf-bf4a-1316c0d336da', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 10:46:01.985', NULL),
('54b59bb5-ae44-4ff6-a4f8-194ab8daa45f', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'UPDATE_PRICING_PLAN', 'Updated pricing plan: high demanded plan', '::1', '2026-08-31 11:34:26.880', NULL),
('58199ed3-6e7f-4f0f-adfa-7f01b6c19bf4', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 10:01:09.331', NULL),
('5868c316-1cc5-4e7c-966b-8ae2e64cad04', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:16:18.028', NULL),
('5b4df1e2-38cd-4a48-9493-97921d74a8ba', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:31:57.112', NULL),
('5ba54e1e-53d0-4e82-833b-90465fb48d0f', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:28:16.508', NULL),
('5bcb045b-402e-402d-9b15-2ed729884197', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:30:38.589', NULL),
('5c087ac5-120d-4cad-90c0-42bd2924a25e', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 08:44:13.840', NULL),
('5ccd4002-c7c4-4223-b8e1-f33335285eb2', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'REORDER_PRICING_PLANS', 'Reordered pricing plans list', '::1', '2026-08-31 09:17:48.387', NULL),
('5d6ccd10-1c76-4f74-bee9-340caac65606', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:51:03.036', NULL),
('5d722f48-c88f-435f-8099-d7835d607859', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'PROVISION_ORGANIZATION', 'Provisioned organization \"wertyui\" with admin \"nishantsolanki3107@gmail.com\" on plan \"Professional\"', '::1', '2026-08-31 12:58:55.439', NULL),
('620a1950-73ad-474e-b802-e9e8f6496d28', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'REORDER_PRICING_PLANS', 'Reordered pricing plans list', '::1', '2026-08-31 09:17:49.142', NULL),
('64c9797b-f5c9-4e95-a61a-422d09ac8f27', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 12:53:11.675', NULL),
('67d9a893-a6ad-42a0-a746-bc66156cc7c5', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 09:03:22.642', NULL),
('68d37aa2-15ca-405d-9327-2e2b33afde75', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:42:12.617', NULL),
('6ae34738-cfad-4c47-9a24-2f8a042ff183', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'UPDATE_PRICING_PLAN', 'Updated pricing plan: HIGH DEMANDED', '::1', '2026-08-31 09:36:32.015', NULL),
('749116bc-73f4-4007-8fca-1ee3d83ea2b0', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:42:51.343', NULL),
('78b3b3d7-2dea-4945-9676-4e9e4efe4e2b', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:41:06.088', NULL),
('78e328b4-49f6-4b4b-8b5b-835e9e4a2bf6', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'CREATE_PRICING_PLAN', 'Created pricing plan: HIGH DEMANDED', '::1', '2026-08-31 09:36:02.158', NULL),
('79f9a31d-0c71-4a92-ae23-b3a0a4426e96', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DELETE_ORGANIZATION', 'Deleted organization \"wearit global  pvt .ltd\"', '::1', '2026-08-31 12:43:56.237', NULL),
('7e8811f6-3c46-44b7-a8be-d4dfed5d45aa', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:32:41.476', NULL),
('817ea379-b4da-405b-a5c6-58f1f4cecffc', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DELETE_PRICING_PLAN', 'Deleted pricing plan: nnnnnnnnnnnnnnn', '::1', '2026-08-31 09:27:44.941', NULL),
('830c3dce-a9fc-40fa-ab5f-c60c8fdb78cb', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 07:30:48.682', NULL),
('839fe205-f21b-448a-b992-0b3dd4e4b245', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 08:54:13.584', NULL),
('843e3108-1d7d-4444-a376-424f38afe8bc', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 07:46:35.718', NULL),
('84631d76-be96-46c4-a4c4-37a396db7803', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 09:47:21.519', NULL),
('857695e5-ec15-462a-9ca9-4d351b5f6200', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:04:27.656', NULL),
('85dd140d-48ab-4c2d-9fb7-17bd9aaf1f2e', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 08:35:22.528', NULL),
('8c575f20-b92e-4153-8870-cf9bdc696d82', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DEACTIVATE_PRICING_PLAN', 'Deactivated pricing plan: Professional', '::1', '2026-08-31 09:19:13.785', NULL),
('8c6a279b-2d9d-49da-a640-f12a99fa5197', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 07:44:27.384', NULL),
('8cb592a5-c7a9-4e57-9656-d44d1c3cd3aa', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:32:35.042', NULL),
('8fd1d577-0af7-427d-a421-763b7bbee016', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::ffff:127.0.0.1', '2026-08-31 12:17:18.544', NULL),
('92bbed68-6641-41dd-8de5-f0084fa4f4d4', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 09:24:38.171', NULL),
('9435c3f4-adc2-4d0d-a6b9-9fc114079916', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 09:02:18.562', NULL),
('9537b514-fdac-4071-b930-11d0ae80c94e', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'REORDER_PRICING_PLANS', 'Reordered pricing plans list', '::1', '2026-08-31 09:17:47.569', NULL),
('96d8217d-acef-41f1-b18e-1945f8d83257', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 09:41:53.251', NULL),
('97e01b5b-5309-443b-8b74-167d95d595bb', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 10:02:50.838', NULL),
('9b5487b5-4422-40f9-bf0c-34369bb59a9d', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'CREATE_PRICING_PLAN', 'Created pricing plan: 12', '::1', '2026-08-31 09:28:35.330', NULL),
('9c9441a2-ba7f-47f9-859a-3cd157adc033', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 10:51:46.328', NULL),
('9db52f8b-498f-47d0-87f9-e528de61aa1e', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:00:07.567', NULL),
('a4759639-817f-4d5c-a0e0-c43f68983cf5', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 08:40:11.902', NULL),
('a760834f-5508-4225-b2e2-eea35ff1f5bb', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:59:07.958', NULL),
('a9b4879d-3688-43f6-8104-720d6602de8c', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:50:47.446', NULL),
('ab044d3b-60e7-496a-94d4-a923075bc372', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:21:06.377', NULL),
('ab89ffa5-53d1-46af-810a-ecfe7b1299e3', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 10:39:30.360', NULL),
('ae5a8107-96c1-426f-8ef8-6d8487a2db8c', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:38:58.223', NULL),
('b0314712-0463-4b48-9f97-0dbd93ae6c4f', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:32:02.532', NULL),
('b184678d-f8a7-48de-ab8f-fe62be903ad0', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 09:05:24.476', NULL),
('b2e025fb-3414-41f1-a472-d74a1d15ba59', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 07:11:23.806', NULL),
('b520219f-6e94-41d8-baef-288116e623e5', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'DELETE_USER', 'Deleted user: moon@gmail.com (EMPLOYEE)', '::1', '2026-08-31 11:27:41.814', NULL),
('b7cfef67-011d-477d-9a5f-424e18250752', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 11:03:04.083', NULL),
('b9858ca4-075b-4c23-a7df-05981c793021', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'ACTIVATE_PRICING_PLAN', 'Activated pricing plan: Professional', '::1', '2026-08-31 09:19:15.468', NULL),
('bb3b993c-9715-44b0-b059-d52aac1dc7ab', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:05:18.612', NULL),
('bb713960-48c4-4808-aa9c-75ff2c53a7ae', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 08:40:20.736', NULL),
('be352f86-8d81-4d9f-9695-1fdd7a0e68f8', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 09:15:37.446', NULL),
('c14be82e-a088-4e7b-9799-9cf852f6f794', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 13:58:58.729', NULL),
('c4d44bcc-84a2-4bb7-bd0f-e5c282139f9b', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 14:06:34.785', NULL),
('c579d307-9903-4eec-84a9-011f35f4e09f', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:55:29.555', NULL),
('c84cb84a-4805-44b2-9eef-39b71825bd57', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:14:04.558', NULL),
('c8e21576-7e8c-4352-ad0b-29b1aa3a708b', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 08:38:03.530', NULL),
('d2cf53e8-8159-4118-8a77-90c451e05819', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 09:04:59.721', NULL),
('d5b1425f-c717-413f-b043-4d899b2b4390', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:46:37.152', NULL),
('d5cc7f09-0444-42f6-ab9b-ed59a158020a', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 06:26:51.841', NULL),
('d63e6bad-b814-4c1d-960f-abea12670579', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 11:20:27.648', NULL),
('d66b7f19-7618-47cb-ac90-3cec01e5fe34', '4782491c-0b8b-4e4c-abe9-e87d95448ec2', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 05:58:37.708', NULL),
('d87d6aee-cb79-4003-96ea-1403be35c871', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 06:52:09.615', NULL),
('d9bc3804-2aa6-48e8-b6bc-3f6dcbfaf690', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'DELETE_PRICING_PLAN', 'Deleted pricing plan: Starter', '::1', '2026-08-31 09:38:01.588', NULL),
('db807563-bce8-4548-ae8b-15602d43e385', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-27 06:30:10.985', NULL),
('db817e7e-ce94-4ce5-8308-4d72490ee69f', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 07:24:35.228', NULL),
('dccc30ff-75f6-4c59-9d86-1dfd49c8968f', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 09:00:12.982', NULL),
('dcf71027-45c7-4acc-8887-3e6204cc9b08', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-26 08:56:36.965', NULL),
('e06234c0-a84d-413d-9ecf-9f2a66df6a4f', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 07:34:13.441', NULL),
('e1aa4aae-40e7-4f46-aa1e-a779940015f9', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:14:18.606', NULL),
('e2b0a245-3dc7-429c-bd19-62f218069f10', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 06:44:08.159', NULL),
('e3231556-ee4a-4f70-92c2-47f801546c22', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 14:44:22.798', NULL),
('e4286d4c-daab-4466-abd4-af4fc71d851b', '414c1f97-53f2-4e9d-b021-52eaaabc764d', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:46:38.834', NULL),
('ed0ebe4a-40c4-4bfa-b6bf-da45af35f05b', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 06:46:38.695', NULL),
('eedbf8b7-8b94-4da0-b88e-605d525f5b79', '414c1f97-53f2-4e9d-b021-52eaaabc764d', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:50:47.516', NULL),
('ef0a1804-3925-4530-b881-6977d488d997', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 08:40:32.925', NULL),
('f1e791cc-7c2c-4902-8fc8-2e1dc4b437e5', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 09:14:38.698', NULL),
('f84971fa-0018-4937-abbc-207d01ccc2cc', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-31 12:39:24.426', NULL),
('f9b30f89-2f9a-4f0b-82c0-953e27f45287', 'c1017bd6-5cae-458f-a430-439127049325', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-22 09:34:03.936', NULL),
('fa3eb50e-a103-41a6-a9e6-adff4fcfb6b5', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'UPDATE_USER', 'Updated user details for: nishantsolanki3107@gmail.com', '::1', '2026-08-31 12:42:18.950', NULL),
('fb7f9e63-c443-4d2a-912f-3dba4e66e876', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'USER_LOGIN', 'User logged in successfully', '::1', '2026-08-25 07:50:08.019', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `benefitclaim`
--

CREATE TABLE `benefitclaim` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Submitted',
  `managerStatus` varchar(191) NOT NULL DEFAULT 'Pending',
  `managerComment` text DEFAULT NULL,
  `receiptUrl` text DEFAULT NULL,
  `receiptName` varchar(191) DEFAULT NULL,
  `managerApprovedAt` datetime(3) DEFAULT NULL,
  `finalApprovalStatus` varchar(191) NOT NULL DEFAULT 'Pending',
  `finalApproverId` varchar(191) DEFAULT NULL,
  `finalApproverRole` varchar(191) DEFAULT NULL,
  `finalApprovalComment` text DEFAULT NULL,
  `finalApprovedAt` datetime(3) DEFAULT NULL,
  `paymentStatus` varchar(191) NOT NULL DEFAULT 'Pending',
  `paymentMethod` varchar(191) DEFAULT NULL,
  `paymentReference` varchar(191) DEFAULT NULL,
  `paymentDate` datetime(3) DEFAULT NULL,
  `overallStatus` varchar(191) NOT NULL DEFAULT 'Submitted',
  `approvalHistory` longtext DEFAULT NULL,
  `claimedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `benefitclaim`
--

INSERT INTO `benefitclaim` (`id`, `employeeId`, `title`, `provider`, `amount`, `status`, `managerStatus`, `managerComment`, `receiptUrl`, `receiptName`, `managerApprovedAt`, `finalApprovalStatus`, `finalApproverId`, `finalApproverRole`, `finalApprovalComment`, `finalApprovedAt`, `paymentStatus`, `paymentMethod`, `paymentReference`, `paymentDate`, `overallStatus`, `approvalHistory`, `claimedAt`) VALUES
('4a05e438-a5f6-4fcb-bb7c-8248e7653bd1', '3cb41d4b-bccb-4956-8d3e-f009fadc8816', 'Health Insurance', 'Prescription pharmacy bill [Receipt: https://ik.imagekit.io/hcmkiaan/hcm/receipts/pharmacy_rx.pdf]', 150, 'Pending', 'Pending', NULL, 'https://ik.imagekit.io/hcmkiaan/hcm/receipts/pharmacy_rx.pdf', 'pharmacy_rx.pdf', NULL, 'Pending', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, 'Pending Manager Approval', '[{\"action\":\"Submitted\",\"actor\":\"Bob Marley\",\"date\":\"2026-08-25T07:50:51.338Z\",\"comment\":\"Claim submitted by employee\",\"receiptUrl\":\"https://ik.imagekit.io/hcmkiaan/hcm/receipts/pharmacy_rx.pdf\",\"receiptName\":\"pharmacy_rx.pdf\"}]', '2026-08-25 07:50:51.338'),
('70acdbab-04d2-4bf6-93f9-fedfd6540896', '3cb41d4b-bccb-4956-8d3e-f009fadc8816', 'Health Insurance', 'Prescription pharmacy bill [Receipt: https://ik.imagekit.io/hcmkiaan/hcm/receipts/pharmacy_rx.pdf]', 150, 'Pending', 'Pending', NULL, 'https://ik.imagekit.io/hcmkiaan/hcm/receipts/pharmacy_rx.pdf', 'pharmacy_rx.pdf', NULL, 'Pending', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, 'Pending Manager Approval', '[{\"action\":\"Submitted\",\"actor\":\"Bob Marley\",\"date\":\"2026-08-25T07:50:10.436Z\",\"comment\":\"Claim submitted by employee\",\"receiptUrl\":\"https://ik.imagekit.io/hcmkiaan/hcm/receipts/pharmacy_rx.pdf\",\"receiptName\":\"pharmacy_rx.pdf\"}]', '2026-08-25 07:50:10.436');

-- --------------------------------------------------------

--
-- Table structure for table `benefitplan`
--

CREATE TABLE `benefitplan` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `contribution` varchar(191) NOT NULL,
  `eligibility` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `empContribution` varchar(191) NOT NULL DEFAULT '0.00',
  `description` text DEFAULT NULL,
  `autoEnroll` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billingplan`
--

CREATE TABLE `billingplan` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `price` int(11) NOT NULL,
  `cycle` varchar(191) NOT NULL,
  `users` int(11) NOT NULL,
  `addons` varchar(191) NOT NULL DEFAULT '[]',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `billingplan`
--

INSERT INTO `billingplan` (`id`, `name`, `price`, `cycle`, `users`, `addons`, `createdAt`, `updatedAt`) VALUES
('6d860cf1-1fba-4616-a5c6-a04fc0e15c2f', 'Professional', 29, 'Monthly', 42, '[\"Premium Support\"]', '2026-08-22 06:50:48.726', '2026-08-22 06:50:48.726');

-- --------------------------------------------------------

--
-- Table structure for table `bonus`
--

CREATE TABLE `bonus` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `reason` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `isTaxable` tinyint(1) NOT NULL DEFAULT 1,
  `effectiveMonth` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Pending',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidateprofile`
--

CREATE TABLE `candidateprofile` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `fullName` varchar(191) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `dob` datetime(3) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `role` varchar(191) DEFAULT NULL,
  `currentSalary` varchar(191) DEFAULT NULL,
  `noticePeriod` varchar(191) DEFAULT NULL,
  `avatarUrl` longtext DEFAULT NULL,
  `resumeUrl` longtext DEFAULT NULL,
  `identityProofUrl` longtext DEFAULT NULL,
  `educationProofUrl` longtext DEFAULT NULL,
  `expectedSalary` varchar(191) DEFAULT NULL,
  `experience` varchar(191) DEFAULT NULL,
  `linkedin` varchar(191) DEFAULT NULL,
  `portfolio` varchar(191) DEFAULT NULL,
  `skills` varchar(191) DEFAULT NULL,
  `resumeData` longtext DEFAULT NULL,
  `profileViews` int(11) NOT NULL DEFAULT 0,
  `resumeDownloads` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `candidateprofile`
--

INSERT INTO `candidateprofile` (`id`, `userId`, `fullName`, `location`, `phone`, `dob`, `address`, `city`, `country`, `bio`, `role`, `currentSalary`, `noticePeriod`, `avatarUrl`, `resumeUrl`, `identityProofUrl`, `educationProofUrl`, `expectedSalary`, `experience`, `linkedin`, `portfolio`, `skills`, `resumeData`, `profileViews`, `resumeDownloads`) VALUES
('b106e697-b2dd-4aa5-b57a-b78de48d51cc', '414c1f97-53f2-4e9d-b021-52eaaabc764d', 'Jane Candidate', NULL, '+1 555-0105', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://ik.imagekit.io/hcmkiaan/hcm/resumes/resume_fmTgkCt9k.pdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `compensationprofile`
--

CREATE TABLE `compensationprofile` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `baseSalary` double DEFAULT NULL,
  `monthlyCTC` double NOT NULL DEFAULT 0,
  `annualCTC` double NOT NULL DEFAULT 0,
  `currency` varchar(191) NOT NULL DEFAULT 'USD',
  `salaryStructureId` varchar(191) DEFAULT NULL,
  `salaryVersionId` varchar(191) DEFAULT NULL,
  `salaryBandId` varchar(191) DEFAULT NULL,
  `effectiveDate` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `version` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `compensationprofile`
--

INSERT INTO `compensationprofile` (`id`, `employeeId`, `baseSalary`, `monthlyCTC`, `annualCTC`, `currency`, `salaryStructureId`, `salaryVersionId`, `salaryBandId`, `effectiveDate`, `status`, `version`, `createdAt`, `updatedAt`) VALUES
('0eac9a04-36ac-4d32-bbb5-2081bb86f742', '38dc44e8-262a-4424-a056-2f0e6ecb42da', 10, 10, 120, 'USD', NULL, NULL, NULL, '2026-08-31 00:00:00.000', 'Active', 1, '2026-08-31 11:29:09.405', '2026-08-31 11:29:09.405');

-- --------------------------------------------------------

--
-- Table structure for table `compensationversion`
--

CREATE TABLE `compensationversion` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `previousSalary` double NOT NULL,
  `newSalary` double NOT NULL,
  `difference` double NOT NULL,
  `reason` varchar(191) DEFAULT NULL,
  `approvedBy` varchar(191) DEFAULT NULL,
  `effectiveDate` datetime(3) NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `version` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customrole`
--

CREATE TABLE `customrole` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isCustom` tinyint(1) NOT NULL DEFAULT 1,
  `permissions` text NOT NULL,
  `inheritsFrom` enum('SUPERADMIN','ADMIN','HR','MANAGER','EMPLOYEE','CANDIDATE') NOT NULL DEFAULT 'EMPLOYEE',
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `landingPage` varchar(191) DEFAULT NULL,
  `permissionVersion` int(11) NOT NULL DEFAULT 1,
  `createdById` varchar(191) DEFAULT NULL,
  `updatedById` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customrole`
--

INSERT INTO `customrole` (`id`, `name`, `description`, `isCustom`, `permissions`, `inheritsFrom`, `status`, `landingPage`, `permissionVersion`, `createdById`, `updatedById`, `createdAt`, `updatedAt`, `organizationId`) VALUES
('14614f24-23cd-45ce-bce1-d60277ab2c16', 'Super Admin', 'Ultimate system access with global clearance', 0, '{\"dashboard\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"org_setup\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"departments\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"users\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"roles_permissions\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"payroll_center\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"holidays\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"benefits_config\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"ai_center\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"compliance\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"integrations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"billing\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"shift_management\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"overtime_rules\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"resignations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reimbursements\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"approval_workflows\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"audit_logs\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reports\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"settings\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"]}', 'SUPERADMIN', 'ACTIVE', NULL, 1, NULL, NULL, '2026-08-22 06:44:08.224', '2026-08-22 06:44:08.224', NULL),
('5d797d9c-1a34-430c-aaa2-2a4ac22582b8', 'Candidate', 'Candidate portal for applications and job offers', 0, '{\"dashboard\":[\"view\"],\"browse_jobs\":[\"view\"],\"my_applications\":[\"view\",\"create\"],\"resume_builder\":[\"view\",\"create\",\"edit\"],\"ai_score\":[\"view\",\"create\"],\"interview_schedule\":[\"view\"],\"notifications\":[\"view\"],\"messages\":[\"view\",\"create\"],\"offers\":[\"view\",\"approve\"],\"settings\":[\"view\",\"edit\"]}', 'CANDIDATE', 'ACTIVE', NULL, 1, NULL, NULL, '2026-08-22 06:44:08.238', '2026-08-22 06:44:08.238', NULL),
('9063c21f-1c52-46aa-9a5b-24c3931fc5ae', 'Manager', 'Team leadership, attendance, approvals, and reviews', 0, '{\"dashboard\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"team_members\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"attendance_review\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"leave_approval\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"kpi_tracking\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"tasks\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reviews\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"team_resignations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reimbursements\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reports\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"]}', 'MANAGER', 'ACTIVE', NULL, 1, NULL, NULL, '2026-08-22 06:44:08.234', '2026-08-22 06:44:08.234', NULL),
('cb620dd3-84ab-4522-aa46-dfe6efb00918', 'Employee', 'Standard employee self-service workspace', 0, '{\"dashboard\":[\"view\"],\"profile\":[\"view\",\"edit\"],\"attendance\":[\"view\",\"create\"],\"leave\":[\"view\",\"create\"],\"payroll\":[\"view\"],\"benefits\":[\"view\",\"create\"],\"documents\":[\"view\",\"create\"],\"performance\":[\"view\"],\"help_desk\":[\"view\",\"create\"],\"compliance\":[\"view\"],\"resignation\":[\"view\",\"create\"]}', 'EMPLOYEE', 'ACTIVE', NULL, 1, NULL, NULL, '2026-08-22 06:44:08.236', '2026-08-22 06:44:08.236', NULL),
('d80d0be6-10b9-4c03-a719-8ba8fbfa0514', 'Admin', 'Full organization management access', 0, '{\"dashboard\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"org_setup\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"departments\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"users\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"roles_permissions\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"payroll_center\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"payroll_operations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"holidays\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"benefits_config\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"ai_center\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"compliance\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"integrations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"billing\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"shift_management\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"shifts\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"overtime_rules\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"overtime_policies\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"resignations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reimbursements\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"approval_workflows\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"audit_logs\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reports\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"settings\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"]}', 'ADMIN', 'ACTIVE', NULL, 1, NULL, NULL, '2026-08-22 06:44:08.228', '2026-08-22 06:44:08.228', NULL),
('e1ec619a-79c7-490a-9542-41a67ff1a0d5', 'HR Manager', 'Recruitment, onboarding, and people operations clearance', 0, '{\"dashboard\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"job_posts\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"candidates\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"interviews\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"hiring_pipeline\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"offer_management\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"onboarding\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"offboarding_resignations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"payroll_operations\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"approvals\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"reports\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"],\"messages\":[\"view\",\"create\",\"edit\",\"delete\",\"approve\",\"manage\"]}', 'HR', 'ACTIVE', NULL, 1, NULL, NULL, '2026-08-22 06:44:08.230', '2026-08-22 06:44:08.230', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `deductionrule`
--

CREATE TABLE `deductionrule` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `valueType` varchar(191) NOT NULL,
  `value` varchar(191) NOT NULL,
  `isPreTax` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `demobooking`
--

CREATE TABLE `demobooking` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `companySize` varchar(191) NOT NULL,
  `requirement` varchar(191) NOT NULL,
  `selectedDate` varchar(191) NOT NULL,
  `selectedSlot` varchar(191) NOT NULL,
  `companyName` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `industry` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `message` varchar(191) DEFAULT NULL,
  `modules` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Pending',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `code` varchar(191) DEFAULT NULL,
  `head` varchar(191) DEFAULT NULL,
  `parent` varchar(191) DEFAULT 'Corporate',
  `description` text DEFAULT NULL,
  `color` varchar(191) DEFAULT '#4f46e5',
  `status` varchar(191) DEFAULT 'Active',
  `parentId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`id`, `name`, `organizationId`, `code`, `head`, `parent`, `description`, `color`, `status`, `parentId`) VALUES
('22be0f18-c66b-40e2-a82d-33f63402901f', 'Human Resources', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL, NULL, 'Corporate', NULL, '#4f46e5', 'Active', NULL),
('91fe281c-22f1-4517-afb2-eeb149c26e7f', 'Product & Design', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL, NULL, 'Corporate', NULL, '#4f46e5', 'Active', NULL),
('a8248b0d-93aa-4b5f-b255-75a05e30b754', 'Engineering', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL, NULL, 'Corporate', NULL, '#4f46e5', 'Active', NULL),
('343c1a26-22db-4f4b-a482-f42fa80f1e93', 'medical department', '3b82ade8-19a3-4434-8029-7183d28a6877', 'M1', 'Sarah Connor', 'Human Resources', NULL, '#e6634c', 'Active', NULL),
('07673140-5272-4070-81cf-47fd6d3e1a01', 'Management', '42d37144-6546-42bf-b4ef-0b9c72632318', 'MGMT', NULL, 'Corporate', NULL, '#4f46e5', 'Active', NULL),
('066ef8ed-07d3-43d6-a0b6-7f1832d9c6e2', 'Management', 'd649340d-e31a-4716-8563-a4bab1517d61', 'MGMT', NULL, 'Corporate', NULL, '#4f46e5', 'Active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document`
--

CREATE TABLE `document` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `size` varchar(191) NOT NULL,
  `url` text NOT NULL,
  `date` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employeebenefit`
--

CREATE TABLE `employeebenefit` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `benefitPlanId` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Pending',
  `enrollmentDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employeededuction`
--

CREATE TABLE `employeededuction` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `deductionId` varchar(191) NOT NULL,
  `customValue` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `effectiveDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employeeprofile`
--

CREATE TABLE `employeeprofile` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `dob` datetime(3) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `bloodGroup` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `joiningDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `employmentType` varchar(191) NOT NULL DEFAULT 'Full-time',
  `avatarUrl` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `language` varchar(191) DEFAULT 'English (US)',
  `timezone` varchar(191) DEFAULT 'UTC+00:00 (London)',
  `dateFormat` varchar(191) DEFAULT 'MM/DD/YYYY',
  `emailNotif` tinyint(1) NOT NULL DEFAULT 1,
  `pushNotif` tinyint(1) NOT NULL DEFAULT 1,
  `weeklySummary` tinyint(1) NOT NULL DEFAULT 1,
  `emergencyName` varchar(191) DEFAULT NULL,
  `emergencyPhone` varchar(191) DEFAULT NULL,
  `emergencyRelation` varchar(191) DEFAULT NULL,
  `departmentId` varchar(191) DEFAULT NULL,
  `managerId` varchar(191) DEFAULT NULL,
  `applicationId` varchar(191) DEFAULT NULL,
  `probationStart` datetime(3) DEFAULT NULL,
  `probationEnd` datetime(3) DEFAULT NULL,
  `probationReviewDate` datetime(3) DEFAULT NULL,
  `probationExtension` int(11) DEFAULT NULL,
  `confirmationDate` datetime(3) DEFAULT NULL,
  `probationStatus` enum('UNDER_PROBATION','EXTENDED','CONFIRMED','REJECTED') DEFAULT 'UNDER_PROBATION',
  `lifecycleStatus` enum('APPLIED','SHORTLISTED','INTERVIEW','OFFERED','OFFER_ACCEPTED','ONBOARDING','ACTIVE','PROBATION','CONFIRMED','ON_NOTICE','EXIT_CLEARANCE','RESIGNED','TERMINATED') DEFAULT 'ACTIVE',
  `shiftId` varchar(191) DEFAULT NULL,
  `overtimePolicyId` varchar(191) DEFAULT NULL,
  `salaryType` varchar(191) NOT NULL DEFAULT 'Monthly',
  `hourlyRate` double DEFAULT NULL,
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employeeprofile`
--

INSERT INTO `employeeprofile` (`id`, `userId`, `employeeId`, `fullName`, `phone`, `dob`, `gender`, `bloodGroup`, `address`, `joiningDate`, `employmentType`, `avatarUrl`, `bio`, `language`, `timezone`, `dateFormat`, `emailNotif`, `pushNotif`, `weeklySummary`, `emergencyName`, `emergencyPhone`, `emergencyRelation`, `departmentId`, `managerId`, `applicationId`, `probationStart`, `probationEnd`, `probationReviewDate`, `probationExtension`, `confirmationDate`, `probationStatus`, `lifecycleStatus`, `shiftId`, `overtimePolicyId`, `salaryType`, `hourlyRate`, `organizationId`) VALUES
('3cb41d4b-bccb-4956-8d3e-f009fadc8816', 'c1017bd6-5cae-458f-a430-439127049325', 'EMP-004', 'Test Name', '+1 555-0104', NULL, NULL, NULL, '1 Love Lane, Kingston', '2026-08-22 06:39:46.116', 'Full-time', 'https://res.cloudinary.com/lojyivli/image/upload/v1787649280/hcm/avatars/zpigxroxarwoogehqrvc.png', NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, 'a8248b0d-93aa-4b5f-b255-75a05e30b754', 'be680e88-b083-4b0e-a76e-17b6077edb72', NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('68c19d7d-0327-4c70-8384-e878a84a48fa', 'bf200349-ba91-4680-a39f-c9bf536df64c', 'EMP-001', 'John Wick', '+1 555-0101', NULL, NULL, NULL, '742 Continental Lane, NY', '2026-08-22 06:39:46.100', 'Full-time', 'https://i.pravatar.cc/150?u=john', NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('be680e88-b083-4b0e-a76e-17b6077edb72', '6befaf96-f142-4aba-b096-4c40875b2318', 'EMP-003', 'Alice Cooper', '+1 555-0103', NULL, NULL, NULL, '456 Rock Ave, Phoenix', '2026-08-22 06:39:46.114', 'Full-time', 'https://i.pravatar.cc/150?u=alice', NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, '91fe281c-22f1-4517-afb2-eeb149c26e7f', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('c42a8b54-1327-4bfb-9fe0-7c97df69e15d', '4782491c-0b8b-4e4c-abe9-e87d95448ec2', 'EMP-002', 'Sarah Connor', '+1 555-0102', NULL, NULL, NULL, '88 Cyberdyne Road, LA', '2026-08-22 06:39:46.108', 'Full-time', 'https://i.pravatar.cc/150?u=sarah', NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, '22be0f18-c66b-40e2-a82d-33f63402901f', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('eef55612-368e-4042-a3de-ee98d8f1715a', '6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'EMP-5453', 'Super Admin User', NULL, NULL, NULL, NULL, NULL, '2026-08-22 09:46:37.180', 'Full-time', 'https://res.cloudinary.com/lojyivli/image/upload/v1787391998/hcm/avatars/dviicubigqahvztystjk.png', NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('91cab78e-0510-4075-a562-985f757c42ea', '56d9d192-b44d-45f6-8c49-850b54532ef1', 'EMP-006', 'moon', '1234567891', NULL, NULL, NULL, 'klkklkm', '2026-08-31 00:00:00.000', 'Part-time', NULL, NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, '22be0f18-c66b-40e2-a82d-33f63402901f', 'c42a8b54-1327-4bfb-9fe0-7c97df69e15d', NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('38dc44e8-262a-4424-a056-2f0e6ecb42da', 'f864daba-90d9-4215-99fc-e0ee6ccaa531', 'EMP-006', 'moon', '1234567891', NULL, NULL, NULL, 'tyds', '2026-08-24 00:00:00.000', 'Part-time', NULL, NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, '343c1a26-22db-4f4b-a482-f42fa80f1e93', 'c42a8b54-1327-4bfb-9fe0-7c97df69e15d', NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('ab220226-992b-4b5a-86cd-adb9045bfba0', '14328c51-df17-4273-9e73-3f0f3bbe6f37', 'EMP-001', 'ramchandra', NULL, NULL, NULL, NULL, 'United States', '2026-08-31 11:51:38.193', 'Full-time', NULL, NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, '07673140-5272-4070-81cf-47fd6d3e1a01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL),
('2cafcdb3-6a42-4f9e-af42-708420b15275', '1d7b47be-6f87-44c2-a8b1-f34ad06c8e3d', 'EMP-3128', 'qwrqerqer', NULL, NULL, NULL, NULL, NULL, '2026-08-31 12:28:04.056', 'Full-time', NULL, NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, 'a632c479-3f1b-4db4-b371-aea63b56c53c'),
('144cf1c2-8afe-4a76-900b-869fc64549e8', 'f5d4f385-ca0b-46ec-902d-9b2157f5d0db', 'EMP-001', 'mnbvcasdf', NULL, NULL, NULL, NULL, 'United States', '2026-08-31 12:58:55.425', 'Full-time', NULL, NULL, 'English (US)', 'UTC+00:00 (London)', 'MM/DD/YYYY', 1, 1, 1, NULL, NULL, NULL, '066ef8ed-07d3-43d6-a0b6-7f1832d9c6e2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'UNDER_PROBATION', 'ACTIVE', NULL, NULL, 'Monthly', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employeesalarycomponent`
--

CREATE TABLE `employeesalarycomponent` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `componentId` varchar(191) NOT NULL,
  `customValue` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `effectiveDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employeeskill`
--

CREATE TABLE `employeeskill` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exitlifecycle`
--

CREATE TABLE `exitlifecycle` (
  `id` varchar(191) NOT NULL,
  `applicationId` varchar(191) DEFAULT NULL,
  `employeeId` varchar(191) NOT NULL,
  `exitType` enum('RESIGNATION','TERMINATION','RETIREMENT','DEATH') NOT NULL DEFAULT 'RESIGNATION',
  `status` enum('PENDING_MANAGER_APPROVAL','PENDING_HR_APPROVAL','APPROVED','REJECTED_BY_MANAGER','REJECTED_BY_HR','EMPLOYEE_RELIEVED','INITIATED','CLEARANCE_IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'INITIATED',
  `submissionDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `lastWorkingDay` datetime(3) NOT NULL,
  `reason` text DEFAULT NULL,
  `itClearance` tinyint(1) NOT NULL DEFAULT 0,
  `financeClearance` tinyint(1) NOT NULL DEFAULT 0,
  `hrClearance` tinyint(1) NOT NULL DEFAULT 0,
  `exitInterviewFeedback` text DEFAULT NULL,
  `exitInterviewRating` int(11) DEFAULT NULL,
  `managerId` varchar(191) DEFAULT NULL,
  `managerComment` text DEFAULT NULL,
  `managerDecisionDate` datetime(3) DEFAULT NULL,
  `hrId` varchar(191) DEFAULT NULL,
  `hrComment` text DEFAULT NULL,
  `hrDecisionDate` datetime(3) DEFAULT NULL,
  `attachmentUrl` text DEFAULT NULL,
  `finalLastWorkingDay` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `globalsettings`
--

CREATE TABLE `globalsettings` (
  `id` varchar(191) NOT NULL DEFAULT 'global-settings',
  `defaultCurrency` varchar(191) NOT NULL DEFAULT 'USD',
  `defaultPhoneCountry` varchar(191) NOT NULL DEFAULT '+1',
  `dateFormat` varchar(191) NOT NULL DEFAULT 'DD/MM/YYYY',
  `platformMode` varchar(191) NOT NULL DEFAULT 'Production',
  `maxOrgs` varchar(191) NOT NULL DEFAULT 'Unlimited',
  `defaultTimezone` varchar(191) NOT NULL DEFAULT 'UTC+00:00 (London)',
  `masterCurrency` varchar(191) NOT NULL DEFAULT 'USD ($) - US Dollar',
  `globalMFA` tinyint(1) NOT NULL DEFAULT 1,
  `auditLogRetention` varchar(191) NOT NULL DEFAULT '90 Days',
  `failedLoginAttempts` int(11) NOT NULL DEFAULT 5,
  `ipWhitelisting` tinyint(1) NOT NULL DEFAULT 0,
  `basePricePerUser` double NOT NULL DEFAULT 8,
  `freeTrialDays` int(11) NOT NULL DEFAULT 14,
  `gracePeriodDays` int(11) NOT NULL DEFAULT 7,
  `invoiceInterval` varchar(191) NOT NULL DEFAULT 'Monthly',
  `primaryModel` varchar(191) NOT NULL DEFAULT 'Google Gemini 1.5 Pro',
  `resumeScanAutoRank` tinyint(1) NOT NULL DEFAULT 1,
  `matchingThreshold` int(11) NOT NULL DEFAULT 75,
  `apiRateLimit` int(11) NOT NULL DEFAULT 1200,
  `reimbursementManagerApproval` tinyint(1) NOT NULL DEFAULT 1,
  `reimbursementFinalApprovalRole` varchar(191) NOT NULL DEFAULT 'ADMIN',
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `globalsettings`
--

INSERT INTO `globalsettings` (`id`, `defaultCurrency`, `defaultPhoneCountry`, `dateFormat`, `platformMode`, `maxOrgs`, `defaultTimezone`, `masterCurrency`, `globalMFA`, `auditLogRetention`, `failedLoginAttempts`, `ipWhitelisting`, `basePricePerUser`, `freeTrialDays`, `gracePeriodDays`, `invoiceInterval`, `primaryModel`, `resumeScanAutoRank`, `matchingThreshold`, `apiRateLimit`, `reimbursementManagerApproval`, `reimbursementFinalApprovalRole`, `updatedAt`) VALUES
('global-settings', 'USD', '+91', 'DD/MM/YYYY', 'Production', 'Unlimited', 'UTC+00:00 (London)', 'USD ($) - US Dollar', 1, '90 Days', 5, 0, 8, 14, 7, 'Monthly', 'Google Gemini 1.5 Pro', 1, 75, 1200, 1, 'ADMIN', '2026-08-22 06:44:01.754');

-- --------------------------------------------------------

--
-- Table structure for table `holiday`
--

CREATE TABLE `holiday` (
  `id` varchar(191) NOT NULL,
  `calendarId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `date` varchar(191) NOT NULL,
  `type` enum('PUBLIC','COMPANY','REGIONAL','OPTIONAL') NOT NULL DEFAULT 'PUBLIC',
  `region` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Upcoming',
  `repeat` tinyint(1) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `integration`
--

CREATE TABLE `integration` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Disconnected',
  `health` varchar(191) NOT NULL DEFAULT '-',
  `sync` varchar(191) NOT NULL DEFAULT 'Manual',
  `icon` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interview`
--

CREATE TABLE `interview` (
  `id` varchar(191) NOT NULL,
  `applicationId` varchar(191) NOT NULL,
  `interviewerId` varchar(191) NOT NULL,
  `dateTime` datetime(3) NOT NULL,
  `meetingLink` varchar(191) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Scheduled',
  `round` varchar(191) DEFAULT NULL,
  `type` varchar(191) DEFAULT 'Video Call',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interview`
--

INSERT INTO `interview` (`id`, `applicationId`, `interviewerId`, `dateTime`, `meetingLink`, `feedback`, `rating`, `status`, `round`, `type`, `createdAt`, `updatedAt`) VALUES
('6c280633-da72-4450-84d6-1e7f36c6f21e', '70be0c6a-f2fb-49bf-9144-1e107225e0e8', 'c42a8b54-1327-4bfb-9fe0-7c97df69e15d', '2026-08-23 06:39:46.134', 'https://meet.google.com/abc-defg-hij', NULL, NULL, 'Scheduled', NULL, 'Video Call', '2026-08-22 06:39:46.141', '2026-08-22 06:39:46.141');

-- --------------------------------------------------------

--
-- Table structure for table `invoice`
--

CREATE TABLE `invoice` (
  `id` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `amount` varchar(191) NOT NULL DEFAULT '$0.00',
  `method` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice`
--

INSERT INTO `invoice` (`id`, `date`, `amount`, `method`, `status`, `createdAt`, `updatedAt`) VALUES
('1f97c817-3ffb-49fd-b2ba-e9eb854d1c2f', '2026-08-01 00:00:00.000', '4,200.00', 'Visa •••• 4242', 'Paid', '2026-08-22 06:50:48.737', '2026-08-22 06:50:48.737'),
('3fb0f45b-d3ae-4858-8f5d-66591f49938d', '2026-07-01 00:00:00.000', '4,200.00', 'Visa •••• 4242', 'Refunded', '2026-08-22 06:50:48.737', '2026-08-22 06:50:48.737'),
('5a0e054f-d24e-48db-879b-96d64c7e4770', '2026-10-01 00:00:00.000', '4,280.00', 'Visa •••• 4242', 'Paid', '2026-08-22 06:50:48.737', '2026-08-22 06:50:48.737'),
('79260e84-40bf-422b-999c-10edcd3b93f2', '2026-09-01 00:00:00.000', '4,280.00', 'Visa •••• 4242', 'Paid', '2026-08-22 06:50:48.737', '2026-08-22 06:50:48.737');

-- --------------------------------------------------------

--
-- Table structure for table `jobapplication`
--

CREATE TABLE `jobapplication` (
  `id` varchar(191) NOT NULL,
  `jobId` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `status` enum('APPLIED','SCREENING','SHORTLISTED','INTERVIEWING','OFFERED','HIRED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'APPLIED',
  `resumeUrl` varchar(191) DEFAULT NULL,
  `coverLetter` text DEFAULT NULL,
  `submittedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `lifecycleStatus` enum('APPLIED','SHORTLISTED','INTERVIEW','OFFERED','OFFER_ACCEPTED','ONBOARDING','ACTIVE','PROBATION','CONFIRMED','ON_NOTICE','EXIT_CLEARANCE','RESIGNED','TERMINATED') DEFAULT 'APPLIED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobapplication`
--

INSERT INTO `jobapplication` (`id`, `jobId`, `candidateId`, `status`, `resumeUrl`, `coverLetter`, `submittedAt`, `lifecycleStatus`) VALUES
('70be0c6a-f2fb-49bf-9144-1e107225e0e8', 'bede8683-6cc6-40b4-9998-3034e2b6070d', 'b106e697-b2dd-4aa5-b57a-b78de48d51cc', 'INTERVIEWING', NULL, 'I would love to join your amazing team and build highly interactive SaaS products.', '2026-08-22 06:39:46.132', 'APPLIED');

-- --------------------------------------------------------

--
-- Table structure for table `jobpost`
--

CREATE TABLE `jobpost` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `department` varchar(191) DEFAULT NULL,
  `description` text NOT NULL,
  `requirements` text NOT NULL,
  `salaryRange` varchar(191) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `jobType` varchar(191) DEFAULT NULL,
  `experience` varchar(191) DEFAULT NULL,
  `openings` int(11) NOT NULL DEFAULT 1,
  `status` varchar(191) NOT NULL DEFAULT 'Published',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobpost`
--

INSERT INTO `jobpost` (`id`, `title`, `department`, `description`, `requirements`, `salaryRange`, `location`, `jobType`, `experience`, `openings`, `status`, `isActive`, `createdAt`, `updatedAt`, `organizationId`) VALUES
('5f1525d5-1744-42c5-8ce0-fa78cf917457', 'Product Manager', NULL, 'Lead SaaS product lifecycle, sprint planning, and target specifications.', 'Agile, Product Roadmap, 3+ years experience', '$130k - $160k', 'Hybrid (New York)', 'Full-Time', NULL, 1, 'Published', 1, '2026-08-22 06:39:46.129', '2026-08-22 06:39:46.129', NULL),
('bede8683-6cc6-40b4-9998-3034e2b6070d', 'Senior Frontend Developer', NULL, 'Join our team to build state-of-the-art UI layouts using React and Vite.', 'React, TypeScript, Tailwind CSS, 5+ years experience', '$120k - $150k', 'Remote', 'Full-Time', NULL, 1, 'Published', 1, '2026-08-22 06:39:46.123', '2026-08-22 06:39:46.123', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `leavepolicy`
--

CREATE TABLE `leavepolicy` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `isPaid` tinyint(1) NOT NULL DEFAULT 1,
  `yearlyAllowance` int(11) NOT NULL DEFAULT 0,
  `organizationId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leaverequest`
--

CREATE TABLE `leaverequest` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `leaveType` varchar(191) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `totalDays` int(11) NOT NULL,
  `reason` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','MANAGER_APPROVED','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `managerComment` varchar(191) DEFAULT NULL,
  `emergencyContact` varchar(191) DEFAULT NULL,
  `attachmentUrl` text DEFAULT NULL,
  `attachmentName` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leaverequest`
--

INSERT INTO `leaverequest` (`id`, `userId`, `leaveType`, `startDate`, `endDate`, `totalDays`, `reason`, `status`, `managerComment`, `emergencyContact`, `attachmentUrl`, `attachmentName`, `createdAt`) VALUES
('7452e1e1-e587-4a27-ae50-44ac9c9f67d8', 'c1017bd6-5cae-458f-a430-439127049325', 'Annual Leave', '2026-08-27', '2026-09-01', 5, 'Family vacation and relaxation.', 'PENDING', NULL, NULL, NULL, NULL, '2026-08-22 06:39:46.146'),
('ac25acb0-d720-4ffc-b1a5-65c5cb57b365', 'c1017bd6-5cae-458f-a430-439127049325', 'Sick Leave', '2026-09-01', '2026-09-02', 2, 'Medical checkup with specialist', 'PENDING', NULL, NULL, 'https://ik.imagekit.io/hcmkiaan/hcm/leaves/medical_report.pdf', 'medical_report.pdf', '2026-08-25 07:50:10.400'),
('cba3610b-fb61-42ab-b89b-eea9daa076e2', 'c1017bd6-5cae-458f-a430-439127049325', 'Sick Leave', '2026-09-01', '2026-09-02', 2, 'Medical checkup with specialist', 'PENDING', NULL, NULL, 'https://ik.imagekit.io/hcmkiaan/hcm/leaves/medical_report.pdf', 'medical_report.pdf', '2026-08-25 07:50:51.314');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` enum('INFO','SUCCESS','WARNING','ALERT') NOT NULL DEFAULT 'INFO',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `link` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`id`, `userId`, `title`, `message`, `type`, `isRead`, `link`, `metadata`, `createdAt`, `updatedAt`, `organizationId`) VALUES
('5ec08b4d-f8d9-4dd2-90a7-889b28841af1', '6befaf96-f142-4aba-b096-4c40875b2318', 'New Reimbursement Claim', 'Bob Marley submitted a new claim for Health Insurance.', 'INFO', 0, NULL, NULL, '2026-08-25 07:50:51.344', '2026-08-25 07:50:51.344', NULL),
('80110347-8586-42b8-b6ca-4e45ff42bb7f', '6befaf96-f142-4aba-b096-4c40875b2318', 'New Reimbursement Claim', 'Bob Marley submitted a new claim for Health Insurance.', 'INFO', 0, NULL, NULL, '2026-08-25 07:50:10.442', '2026-08-25 07:50:10.442', NULL),
('ba9d912f-9cbc-44d0-ab07-600257197b65', '6befaf96-f142-4aba-b096-4c40875b2318', 'Leave Approval Pending', 'Bob Marley requested 2 days of Sick Leave.', 'WARNING', 0, '/manager/leave', NULL, '2026-08-25 07:50:51.320', '2026-08-25 07:50:51.320', NULL),
('c5925d1c-5515-44c1-b4c0-f0be8a4076d9', '6befaf96-f142-4aba-b096-4c40875b2318', 'Leave Approval Pending', 'Bob Marley requested 2 days of Sick Leave.', 'WARNING', 0, '/manager/leave', NULL, '2026-08-25 07:50:10.418', '2026-08-25 07:50:10.418', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `offer`
--

CREATE TABLE `offer` (
  `id` varchar(191) NOT NULL,
  `applicationId` varchar(191) DEFAULT NULL,
  `candidate` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `salary` varchar(191) NOT NULL,
  `joiningDate` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Sent',
  `sentDate` varchar(191) NOT NULL,
  `letterContent` longtext DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `onboarding`
--

CREATE TABLE `onboarding` (
  `id` varchar(191) NOT NULL,
  `applicationId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `role` varchar(191) NOT NULL,
  `department` varchar(191) DEFAULT NULL,
  `manager` varchar(191) DEFAULT NULL,
  `joiningDate` varchar(191) DEFAULT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'Not Started',
  `avatar` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organization`
--

CREATE TABLE `organization` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `legalName` varchar(191) DEFAULT NULL,
  `websiteUrl` varchar(191) DEFAULT NULL,
  `industry` varchar(191) DEFAULT NULL,
  `companySize` varchar(191) DEFAULT NULL,
  `logoUrl` longtext DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `taxId` varchar(191) DEFAULT NULL,
  `primaryEmail` varchar(191) DEFAULT NULL,
  `supportPhone` varchar(191) DEFAULT NULL,
  `timezone` varchar(191) DEFAULT NULL,
  `currency` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `pricingPlanId` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `subscriptionEnd` datetime(3) DEFAULT NULL,
  `subscriptionStart` datetime(3) DEFAULT NULL,
  `subscriptionStatus` varchar(191) NOT NULL DEFAULT 'TRIAL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organization`
--

INSERT INTO `organization` (`id`, `name`, `legalName`, `websiteUrl`, `industry`, `companySize`, `logoUrl`, `address`, `taxId`, `primaryEmail`, `supportPhone`, `timezone`, `currency`, `createdAt`, `updatedAt`, `pricingPlanId`, `email`, `phone`, `status`, `subscriptionEnd`, `subscriptionStart`, `subscriptionStatus`) VALUES
('3b82ade8-19a3-4434-8029-7183d28a6877', 'GlobalTech Solutions', 'GlobalTech Solutions Inc.', NULL, NULL, NULL, 'https://res.cloudinary.com/lojyivli/image/upload/v1788165744/hcm/logos/fphrdl0gfabcufsfae1l.png', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-22 06:39:46.006', '2026-08-31 08:42:25.155', NULL, NULL, NULL, 'ACTIVE', NULL, NULL, 'TRIAL'),
('a632c479-3f1b-4db4-b371-aea63b56c53c', 'wregterye', NULL, NULL, 'Technology', '1-50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-31 12:28:04.035', '2026-08-31 12:57:06.983', NULL, 'nishantsolanki3107@gmail.com', '13131313313', 'SUSPENDED', '2026-09-14 12:28:04.033', '2026-08-31 12:28:04.033', 'TRIAL'),
('d649340d-e31a-4716-8563-a4bab1517d61', 'wertyui', NULL, NULL, 'Technology', NULL, NULL, 'United States', NULL, NULL, NULL, NULL, NULL, '2026-08-31 12:58:55.411', '2026-08-31 12:58:55.411', '39e014be-22f8-4069-a321-3ae065b118fc', NULL, NULL, 'ACTIVE', NULL, '2026-08-31 12:58:55.409', 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `overtimepolicy`
--

CREATE TABLE `overtimepolicy` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `weekdayMultiplier` double NOT NULL DEFAULT 1.5,
  `weekendMultiplier` double NOT NULL DEFAULT 2,
  `holidayMultiplier` double NOT NULL DEFAULT 2,
  `minOvertimeMin` int(11) NOT NULL DEFAULT 30,
  `maxOvertimeMin` int(11) NOT NULL DEFAULT 240,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `organizationId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrollconfiguration`
--

CREATE TABLE `payrollconfiguration` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `masterCurrency` varchar(191) NOT NULL DEFAULT 'USD',
  `payrollCycle` varchar(191) NOT NULL DEFAULT 'Monthly',
  `calculationBase` varchar(191) NOT NULL DEFAULT 'Fixed Days',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrollitem`
--

CREATE TABLE `payrollitem` (
  `id` varchar(191) NOT NULL,
  `snapshotId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrollsnapshot`
--

CREATE TABLE `payrollsnapshot` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `month` varchar(191) NOT NULL,
  `monthlyCTC` double NOT NULL DEFAULT 0,
  `salaryStructureVersionId` varchar(191) DEFAULT NULL,
  `grossSalary` double NOT NULL,
  `totalDeductions` double NOT NULL,
  `totalContributions` double NOT NULL DEFAULT 0,
  `netSalary` double NOT NULL,
  `employerCost` double NOT NULL DEFAULT 0,
  `totalWorkingDays` double NOT NULL DEFAULT 0,
  `presentDays` double NOT NULL DEFAULT 0,
  `paidLeaveDays` double NOT NULL DEFAULT 0,
  `unpaidLeaveDays` double NOT NULL DEFAULT 0,
  `overtimeHours` double NOT NULL DEFAULT 0,
  `overtimeAmount` double NOT NULL DEFAULT 0,
  `calculationLog` longtext DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Draft',
  `paymentDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payslip`
--

CREATE TABLE `payslip` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `month` varchar(191) NOT NULL,
  `basic` double NOT NULL,
  `hra` double NOT NULL,
  `allowance` double NOT NULL,
  `bonus` double NOT NULL DEFAULT 0,
  `pf` double NOT NULL,
  `tax` double NOT NULL,
  `netPay` double NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Unpaid',
  `paymentDate` datetime(3) DEFAULT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'USD',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payslip`
--

INSERT INTO `payslip` (`id`, `employeeId`, `month`, `basic`, `hra`, `allowance`, `bonus`, `pf`, `tax`, `netPay`, `status`, `paymentDate`, `currency`, `createdAt`) VALUES
('e0d049c8-7eb2-4404-ac16-490a2b92343a', '3cb41d4b-bccb-4956-8d3e-f009fadc8816', 'June', 6000, 1200, 500, 300, 400, 300, 7300, 'Paid', '2026-08-22 06:39:46.147', 'USD', '2026-08-22 06:39:46.148');

-- --------------------------------------------------------

--
-- Table structure for table `performancegoal`
--

CREATE TABLE `performancegoal` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `priority` varchar(191) NOT NULL DEFAULT 'Medium',
  `deadline` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `performancegoal`
--

INSERT INTO `performancegoal` (`id`, `employeeId`, `title`, `progress`, `priority`, `deadline`, `createdAt`, `updatedAt`) VALUES
('ff37ef83-785e-4acd-8203-8994d8ab15fb', '3cb41d4b-bccb-4956-8d3e-f009fadc8816', 'Complete React 19 Upgrade', 60, 'High', '2026-09-30 00:00:00.000', '2026-08-22 06:39:46.154', '2026-08-22 06:39:46.154');

-- --------------------------------------------------------

--
-- Table structure for table `performancereview`
--

CREATE TABLE `performancereview` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `period` varchar(191) NOT NULL,
  `reviewer` varchar(191) NOT NULL,
  `rating` varchar(191) NOT NULL,
  `text` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `policy`
--

CREATE TABLE `policy` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `department` varchar(191) DEFAULT 'All',
  `owner` varchar(191) NOT NULL,
  `effectiveDate` varchar(191) DEFAULT NULL,
  `expiryDate` varchar(191) DEFAULT NULL,
  `version` varchar(191) DEFAULT '1.0',
  `requiresSignature` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('Active','Expiring Soon','Renewing','Archived') NOT NULL DEFAULT 'Active',
  `description` text DEFAULT NULL,
  `pdfName` varchar(191) DEFAULT NULL,
  `pdfData` longtext DEFAULT NULL,
  `acknowledgments` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `policyacknowledgment`
--

CREATE TABLE `policyacknowledgment` (
  `id` varchar(191) NOT NULL,
  `policyId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `organizationId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pricingfeature`
--

CREATE TABLE `pricingfeature` (
  `id` varchar(191) NOT NULL,
  `pricingPlanId` varchar(191) NOT NULL,
  `feature` varchar(191) NOT NULL,
  `displayOrder` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pricingfeature`
--

INSERT INTO `pricingfeature` (`id`, `pricingPlanId`, `feature`, `displayOrder`) VALUES
('03a56214-31b7-4ce5-9e49-e09fa5f2adb3', '39e014be-22f8-4069-a321-3ae065b118fc', 'API & Webhook Integrations', 4),
('195fe81e-082b-4585-8522-8a4298b4b989', '7c06fcf8-d6c3-44c6-8b64-01893f98f3c1', 'Employee Self Service', 0),
('1d25a9c4-a795-404a-bf74-1984fbccc625', '39e014be-22f8-4069-a321-3ae065b118fc', 'Priority 24/7 Support', 3),
('3032feeb-6c2b-406f-b5ca-bf7b4a5ccc05', 'b716301e-d3b4-4388-a455-e5b6dbea475e', 'Custom Workflow Automation', 0),
('37b263c8-9ccf-4872-a9df-b42e8e646950', '39e014be-22f8-4069-a321-3ae065b118fc', 'KPI & Performance Tracking', 2),
('3fdd1cb0-2c35-4f44-b861-9fcdc08286ae', '7c06fcf8-d6c3-44c6-8b64-01893f98f3c1', 'Email Support', 3),
('7a84a37b-472d-44df-b528-e5d0b2c83d1d', 'b716301e-d3b4-4388-a455-e5b6dbea475e', 'HIPAA/SOC2 Security Suite', 4),
('7f1341b5-e444-4bb8-b01f-43d8bbb8ba21', '7c06fcf8-d6c3-44c6-8b64-01893f98f3c1', 'Core Directory & Attendance', 1),
('a15bcd8b-8635-4586-9a59-d6f295b2b665', '7c06fcf8-d6c3-44c6-8b64-01893f98f3c1', 'Document Storage (5GB)', 2),
('aa3eff13-07ce-4723-9ab4-e6782c6d5801', 'b716301e-d3b4-4388-a455-e5b6dbea475e', 'Dedicated Account Manager', 2),
('b808b5c8-779f-4512-82e4-10e98ef89869', 'b716301e-d3b4-4388-a455-e5b6dbea475e', 'Unlimited AI Screen credits', 3),
('eb265cc0-4922-4691-930b-b1ed71a8f9ba', 'b716301e-d3b4-4388-a455-e5b6dbea475e', 'Biometric/Clock-in Synced Logs', 1),
('f0fb8c6c-bfc6-411e-80de-38dddea7c1fa', '39e014be-22f8-4069-a321-3ae065b118fc', 'AI Recruitment assistant', 0),
('f79aff26-b5d2-40ca-b1db-061c02a6ff16', '39e014be-22f8-4069-a321-3ae065b118fc', 'Automated Payroll processing', 1),
('4b44d80b-282c-401c-9941-0a77a759253e', '78e04d5f-ecce-4220-82ad-0704e897dd8c', 'Core Directory access', 0),
('4c4b0f61-de4d-4403-8c3b-e68e87cfbd38', '9c4a7049-9a41-4e3a-be55-a783cda9a389', 'Core Directory access', 0),
('145a710e-a415-4a7c-8420-1a779018c78b', '949b09b2-76b1-47aa-b8cf-5aa1984fc583', 'Core Directory access', 0),
('d3df4e27-8756-47a9-a47c-2fa39d4aadc5', 'c457590b-b8c3-433b-a745-d4ce12d256b7', 'Core Directory access', 0);

-- --------------------------------------------------------

--
-- Table structure for table `pricingplan`
--

CREATE TABLE `pricingplan` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `monthlyPrice` double NOT NULL,
  `yearlyPrice` double NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'USD',
  `billingCycle` varchar(191) NOT NULL DEFAULT 'Monthly',
  `trialDays` int(11) NOT NULL DEFAULT 14,
  `maxEmployees` int(11) NOT NULL DEFAULT 100,
  `maxAdmins` int(11) NOT NULL DEFAULT 3,
  `storageLimit` int(11) NOT NULL DEFAULT 10,
  `aiCredits` int(11) DEFAULT 0,
  `supportLevel` varchar(191) NOT NULL DEFAULT 'Standard',
  `buttonText` varchar(191) NOT NULL DEFAULT 'Start Trial',
  `buttonLink` varchar(191) NOT NULL DEFAULT '/login',
  `isPopular` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pricingplan`
--

INSERT INTO `pricingplan` (`id`, `name`, `description`, `monthlyPrice`, `yearlyPrice`, `currency`, `billingCycle`, `trialDays`, `maxEmployees`, `maxAdmins`, `storageLimit`, `aiCredits`, `supportLevel`, `buttonText`, `buttonLink`, `isPopular`, `isActive`, `displayOrder`, `createdAt`, `updatedAt`) VALUES
('39e014be-22f8-4069-a321-3ae065b118fc', 'Professional', 'Advanced automation & analytics for scaling firms.', 39, 372, 'USD', 'Both', 14, 100, 5, 25, 500, 'Priority 24/7 Support', 'Get Professional', '/login', 1, 1, 0, '2026-08-22 06:44:01.811', '2026-08-31 09:19:15.462'),
('b716301e-d3b4-4388-a455-e5b6dbea475e', 'Enterprise', 'Tailored security, unlimited scaling, and full features.', 99, 948, 'USD', 'Both', 30, 9999, 99, 500, 5000, 'Dedicated Account Manager', 'Contact Enterprise', '/book-demo', 0, 1, 2, '2026-08-22 06:44:01.818', '2026-08-31 09:17:49.128'),
('c457590b-b8c3-433b-a745-d4ce12d256b7', 'high demanded plan', '', 10, 100, 'USD', 'Both', 14, 5, 3, 10, 100, 'Priority Email', 'Start Free Trial', '/login', 0, 1, 0, '2026-08-31 11:34:04.550', '2026-08-31 11:34:26.868');

-- --------------------------------------------------------

--
-- Table structure for table `salaryband`
--

CREATE TABLE `salaryband` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `minSalary` double NOT NULL,
  `maxSalary` double NOT NULL,
  `recommendedSalary` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salarycomponent`
--

CREATE TABLE `salarycomponent` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL DEFAULT 'Earning',
  `calculationType` varchar(191) NOT NULL DEFAULT 'Fixed',
  `calculationBase` varchar(191) DEFAULT NULL,
  `value` varchar(191) NOT NULL,
  `formula` text DEFAULT NULL,
  `sequence` int(11) NOT NULL DEFAULT 0,
  `isTaxable` tinyint(1) NOT NULL DEFAULT 1,
  `isAutoBalance` tinyint(1) NOT NULL DEFAULT 0,
  `isEmployerContribution` tinyint(1) NOT NULL DEFAULT 0,
  `isEmployeeDeduction` tinyint(1) NOT NULL DEFAULT 0,
  `roundingRule` varchar(191) NOT NULL DEFAULT 'Nearest',
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salaryincrementrequest`
--

CREATE TABLE `salaryincrementrequest` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `requestedSalary` double NOT NULL,
  `reason` text DEFAULT NULL,
  `effectiveDate` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Pending',
  `workflowId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salarystructure`
--

CREATE TABLE `salarystructure` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'USD',
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `currentVersionId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salarystructurecomponent`
--

CREATE TABLE `salarystructurecomponent` (
  `id` varchar(191) NOT NULL,
  `versionId` varchar(191) NOT NULL,
  `componentId` varchar(191) NOT NULL,
  `sequence` int(11) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `calculationType` varchar(191) DEFAULT NULL,
  `calculationBase` varchar(191) DEFAULT NULL,
  `value` varchar(191) DEFAULT NULL,
  `formula` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salarystructureversion`
--

CREATE TABLE `salarystructureversion` (
  `id` varchar(191) NOT NULL,
  `structureId` varchar(191) NOT NULL,
  `version` int(11) NOT NULL,
  `effectiveFrom` datetime(3) DEFAULT NULL,
  `effectiveTo` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shift`
--

CREATE TABLE `shift` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `startTime` varchar(191) NOT NULL,
  `endTime` varchar(191) NOT NULL,
  `breakDurationMin` int(11) NOT NULL DEFAULT 60,
  `workingHoursMin` int(11) NOT NULL DEFAULT 480,
  `graceInMin` int(11) NOT NULL DEFAULT 15,
  `graceOutMin` int(11) NOT NULL DEFAULT 15,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `organizationId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supportticket`
--

CREATE TABLE `supportticket` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `priority` varchar(191) NOT NULL,
  `status` enum('OPEN','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'OPEN',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supportticket`
--

INSERT INTO `supportticket` (`id`, `userId`, `subject`, `category`, `priority`, `status`, `createdAt`) VALUES
('841561e1-fe41-41c0-9d85-6c15a39efbcd', 'c1017bd6-5cae-458f-a430-439127049325', 'VPN Connection Issues', 'IT Support', 'High', 'OPEN', '2026-08-22 06:39:46.151');

-- --------------------------------------------------------

--
-- Table structure for table `task`
--

CREATE TABLE `task` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Pending',
  `priority` varchar(191) NOT NULL DEFAULT 'Medium',
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task`
--

INSERT INTO `task` (`id`, `employeeId`, `title`, `description`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`) VALUES
('fd1163c0-694f-4979-aa6c-a17605459e3e', '3cb41d4b-bccb-4956-8d3e-f009fadc8816', 'Debug Login Session Redirects', 'Analyze axios 401 response handling and verify fallback modes.', 'Pending', 'High', '2026-08-24 06:39:46.155', '2026-08-22 06:39:46.156', '2026-08-22 06:39:46.156');

-- --------------------------------------------------------

--
-- Table structure for table `taxrule`
--

CREATE TABLE `taxrule` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `country` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `slabs` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticketmessage`
--

CREATE TABLE `ticketmessage` (
  `id` varchar(191) NOT NULL,
  `ticketId` varchar(191) NOT NULL,
  `senderId` varchar(191) NOT NULL,
  `text` text NOT NULL,
  `attachmentUrl` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ticketmessage`
--

INSERT INTO `ticketmessage` (`id`, `ticketId`, `senderId`, `text`, `attachmentUrl`, `createdAt`) VALUES
('66910284-2e8e-4c02-8f26-edf886b5c31f', '841561e1-fe41-41c0-9d85-6c15a39efbcd', 'c1017bd6-5cae-458f-a430-439127049325', 'Here is the requested diagnostics log screenshot.', 'https://ik.imagekit.io/hcmkiaan/hcm/tickets/diagnostics.png', '2026-08-25 07:50:10.462'),
('9287ba35-984e-428a-8fe6-c8835127839d', '841561e1-fe41-41c0-9d85-6c15a39efbcd', 'c1017bd6-5cae-458f-a430-439127049325', 'Here is the requested diagnostics log screenshot.', 'https://ik.imagekit.io/hcmkiaan/hcm/tickets/diagnostics.png', '2026-08-25 07:50:51.356'),
('f41391fa-1040-4600-a7ae-75aca049b7c6', '841561e1-fe41-41c0-9d85-6c15a39efbcd', 'c1017bd6-5cae-458f-a430-439127049325', 'Unable to connect to the corporate VPN from home network.', NULL, '2026-08-22 06:39:46.151');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('SUPERADMIN','ADMIN','HR','MANAGER','EMPLOYEE','CANDIDATE') NOT NULL DEFAULT 'EMPLOYEE',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `organizationId` varchar(191) DEFAULT NULL,
  `customRoleId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `passwordHash`, `role`, `isActive`, `status`, `createdAt`, `updatedAt`, `organizationId`, `customRoleId`) VALUES
('414c1f97-53f2-4e9d-b021-52eaaabc764d', 'candidate@hcm.ai', '$2b$10$TitR5z.9wlsI8tE8Tx5f5OXYKeoxeJqujqh.fUg1jHZpuRHrzZm2C', 'CANDIDATE', 1, 'Active', '2026-08-22 06:39:46.119', '2026-08-25 06:46:38.828', NULL, NULL),
('4782491c-0b8b-4e4c-abe9-e87d95448ec2', 'hr@hcm.ai', '$2b$10$.SOVaordBw3b9EHGoMrf1.k9Cu5gHshUSKMCQrx3aqRkXto1ZFSmy', 'HR', 1, 'Active', '2026-08-22 06:39:46.108', '2026-08-22 06:39:46.108', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL),
('6befaf96-f142-4aba-b096-4c40875b2318', 'manager@hcm.ai', '$2b$10$.SOVaordBw3b9EHGoMrf1.k9Cu5gHshUSKMCQrx3aqRkXto1ZFSmy', 'MANAGER', 1, 'Active', '2026-08-22 06:39:46.114', '2026-08-22 06:39:46.114', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL),
('6c67058a-67e1-4619-addf-9aac2e0a0cb6', 'superadmin@hcm.ai', '$2b$10$snpiZHRD0FeQatNWrCBj/uLt2AVA0AJZha.8hBI49TMaThxnKJxJC', 'SUPERADMIN', 1, 'Active', '2026-08-22 06:39:46.096', '2026-08-25 06:14:04.466', NULL, NULL),
('bf200349-ba91-4680-a39f-c9bf536df64c', 'admin@hcm.ai', '$2b$10$bir2DE5zjnR6YfAkS0kIDujsxWfDHPyvVAJ8B6UxgjTNUqmQBT8JG', 'ADMIN', 1, 'Active', '2026-08-22 06:39:46.100', '2026-08-25 09:04:59.666', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL),
('c1017bd6-5cae-458f-a430-439127049325', 'employee@hcm.ai', '$2b$10$8SNWImT2gDZ1wCTmB993DOnKPpBqSqmhMFo4jDvwO/cYkKaQBVUmO', 'EMPLOYEE', 1, 'Active', '2026-08-22 06:39:46.116', '2026-08-25 07:53:39.217', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL),
('f864daba-90d9-4215-99fc-e0ee6ccaa531', 'moon@gmail.com', '$2b$10$mqOkB8uumYOydEvrqhbWJe8yIXUZd4X2l3DT/f86kcyZE/c.Wky/6', 'EMPLOYEE', 1, 'Active', '2026-08-31 11:29:09.405', '2026-08-31 11:29:09.405', '3b82ade8-19a3-4434-8029-7183d28a6877', NULL),
('14328c51-df17-4273-9e73-3f0f3bbe6f37', 'ramchandra@gmail.com', '$2b$10$x9aMkO4jpKmKd41qizUbYu9hU/Y913PT7SZ6JLedzKlLjHrb6bYHO', 'ADMIN', 1, 'Active', '2026-08-31 11:51:38.196', '2026-08-31 11:51:38.196', '42d37144-6546-42bf-b4ef-0b9c72632318', NULL),
('f5d4f385-ca0b-46ec-902d-9b2157f5d0db', 'nishantsolanki3107@gmail.com', '$2b$10$J1Lu7uf4lESGxEXQu4VvA.mrMvRh8va4EB/.IV7EYyQ2Mqmy6xLmq', 'ADMIN', 1, 'Active', '2026-08-31 12:58:55.427', '2026-08-31 12:58:55.427', 'd649340d-e31a-4716-8563-a4bab1517d61', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `workcalendar`
--

CREATE TABLE `workcalendar` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `timezone` varchar(191) NOT NULL DEFAULT 'UTC',
  `isDefaultCompanyCalendar` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workcalendarassignment`
--

CREATE TABLE `workcalendarassignment` (
  `id` varchar(191) NOT NULL,
  `calendarId` varchar(191) NOT NULL,
  `entityType` enum('EMPLOYEE','DEPARTMENT','LOCATION','SHIFT','BRANCH') NOT NULL,
  `entityId` varchar(191) NOT NULL,
  `effectiveFrom` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `effectiveTo` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workcalendarversion`
--

CREATE TABLE `workcalendarversion` (
  `id` varchar(191) NOT NULL,
  `calendarId` varchar(191) NOT NULL,
  `versionNumber` int(11) NOT NULL DEFAULT 1,
  `effectiveFrom` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `effectiveTo` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workcalendarweekend`
--

CREATE TABLE `workcalendarweekend` (
  `id` varchar(191) NOT NULL,
  `versionId` varchar(191) NOT NULL,
  `dayOfWeek` varchar(191) NOT NULL,
  `type` enum('FULL_DAY','HALF_DAY','WORKING_DAY') NOT NULL DEFAULT 'FULL_DAY'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('16ec8aa0-df95-4848-9ab7-afdaa838bc03', '017b9109c36b3ee57f9b942923e4ce5a781e9257e594308879afccea2fcd3c9e', '2026-08-22 06:39:42.302', '20260626162000_make_avatar_url_text', NULL, NULL, '2026-08-22 06:39:42.289', 1),
('190f5110-14fb-41f4-8fc7-e9f0aacdd053', 'b6fa4f81814b558c736c391c3defdb3d95e650803e7b751eda2bbb925b602a94', '2026-08-22 06:39:42.340', '20260728134900_add_department_hierarchy', NULL, NULL, '2026-08-22 06:39:42.315', 1),
('2a4ab2c2-3871-4104-b869-2dee0d9a421b', 'd099bfc28bb486b50e30c1cf66536cfafe0f64af9a1f34b1a20ac7d607482503', '2026-08-22 06:39:42.268', '20260622070538_init', NULL, NULL, '2026-08-22 06:39:41.973', 1),
('39b621e8-8211-4a64-ba1f-259c3a978dcd', '691faf90d7d06b29fbcbe547d4cae8be8fd658d26495fce51814f032a8ecd353', '2026-08-22 06:39:42.308', '20260626170000_extend_organization_profile', NULL, NULL, '2026-08-22 06:39:42.303', 1),
('55a3cbd2-1519-41be-81c6-ef245bffb57c', '81a3d748925b56624153cd7b7a7da9333d7f492221c305372b1d5d9adafd955b', '2026-08-22 06:39:44.582', '20260822063943_add_attachment_fields_20260822', NULL, NULL, '2026-08-22 06:39:43.221', 1),
('c8871e47-e1a8-4221-b23d-4cc8476ee536', '547f54bc9c46150589306ac1328ad6d5b09cd88900d040d805c36835191aa8c3', '2026-08-22 06:39:42.277', '20260626153000_add_employee_employment_type', NULL, NULL, '2026-08-22 06:39:42.269', 1),
('c918df6a-9ee1-452d-a482-087e2e2f72b6', '0af8faf34ba5a68834d802fdb9fed07e10ee39b3632da92a375ec9bcf6487563', '2026-08-22 06:39:42.315', '20260627120000_extend_department_profile', NULL, NULL, '2026-08-22 06:39:42.309', 1),
('e9897d2e-07c4-49e4-8c49-89cc3fdf028b', '004cd4d2999c923945d556f2a11d9397dee14de3abb185a8c024b11181eec9c1', '2026-08-22 06:39:42.288', '20260626154500_add_user_status', NULL, NULL, '2026-08-22 06:39:42.278', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ailog`
--
ALTER TABLE `ailog`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `aimodule`
--
ALTER TABLE `aimodule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `aimodule_name_key` (`name`);

--
-- Indexes for table `announcement`
--
ALTER TABLE `announcement`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `approvallog`
--
ALTER TABLE `approvallog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approvallog_approverId_fkey` (`approverId`);

--
-- Indexes for table `approvalstep`
--
ALTER TABLE `approvalstep`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approvalstep_workflowId_fkey` (`workflowId`);

--
-- Indexes for table `approvalworkflow`
--
ALTER TABLE `approvalworkflow`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approvalworkflow_organizationId_fkey` (`organizationId`);

--
-- Indexes for table `attendancelog`
--
ALTER TABLE `attendancelog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attendancelog_userId_fkey` (`userId`),
  ADD KEY `attendancelog_shiftId_fkey` (`shiftId`);

--
-- Indexes for table `attendancepolicy`
--
ALTER TABLE `attendancepolicy`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendancepolicy_organizationId_key` (`organizationId`);

--
-- Indexes for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auditlog_userId_fkey` (`userId`),
  ADD KEY `auditlog_organizationId_fkey` (`organizationId`);

--
-- Indexes for table `benefitclaim`
--
ALTER TABLE `benefitclaim`
  ADD PRIMARY KEY (`id`),
  ADD KEY `benefitclaim_employeeId_fkey` (`employeeId`);

--
-- Indexes for table `benefitplan`
--
ALTER TABLE `benefitplan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `benefitplan_organizationId_name_key` (`organizationId`,`name`);

--
-- Indexes for table `billingplan`
--
ALTER TABLE `billingplan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `billingplan_name_key` (`name`);

--
-- Indexes for table `bonus`
--
ALTER TABLE `bonus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bonus_employeeId_fkey` (`employeeId`);

--
-- Indexes for table `candidateprofile`
--
ALTER TABLE `candidateprofile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `candidateprofile_userId_key` (`userId`);

--
-- Indexes for table `compensationprofile`
--
ALTER TABLE `compensationprofile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `compensationprofile_employeeId_key` (`employeeId`),
  ADD KEY `compensationprofile_salaryStructureId_fkey` (`salaryStructureId`),
  ADD KEY `compensationprofile_salaryVersionId_fkey` (`salaryVersionId`),
  ADD KEY `compensationprofile_salaryBandId_fkey` (`salaryBandId`);

--
-- Indexes for table `compensationversion`
--
ALTER TABLE `compensationversion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `compensationversion_employeeId_fkey` (`employeeId`);

--
-- Indexes for table `customrole`
--
ALTER TABLE `customrole`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customrole_name_key` (`name`),
  ADD UNIQUE KEY `customrole_organizationId_name_key` (`organizationId`,`name`),
  ADD KEY `customrole_createdById_fkey` (`createdById`),
  ADD KEY `customrole_updatedById_fkey` (`updatedById`);

--
-- Indexes for table `deductionrule`
--
ALTER TABLE `deductionrule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `deductionrule_code_key` (`code`),
  ADD KEY `deductionrule_organizationId_fkey` (`organizationId`);

--
-- Indexes for table `demobooking`
--
ALTER TABLE `demobooking`
  ADD PRIMARY KEY (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
