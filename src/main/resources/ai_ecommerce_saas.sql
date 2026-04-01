SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
-- ai_ecommerce_saas DDL
CREATE DATABASE `ai_ecommerce_saas`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;;
use `ai_ecommerce_saas`;
-- ai_ecommerce_saas.permission DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`permission`;
CREATE TABLE `ai_ecommerce_saas`.`permission` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT Comment "权限ID",
`parent_id` BIGINT UNSIGNED NULL DEFAULT 0 Comment "父权限ID，0表示根节点",
`name` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "权限名称（显示用）",
`code` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "权限标识（唯一），如 upload:file",
`type` TINYINT NOT NULL DEFAULT 1 Comment "权限类型：1=功能权限，2=菜单权限，3=按钮权限",
`path` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "对应API路径，如 /api/upload/coze",
`method` VARCHAR(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "请求方法，如 POST",
`status` TINYINT NOT NULL DEFAULT 1 Comment "状态：1=启用，0=禁用",
`sort` INT NULL DEFAULT 0 Comment "排序号",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "逻辑删除：0=未删除，1=已删除",
`create_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP Comment "创建时间",
`update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) Comment "更新时间",
INDEX `idx_deleted`(`deleted` ASC) USING BTREE,
INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
INDEX `idx_status`(`status` ASC) USING BTREE,
UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 17 ROW_FORMAT = Dynamic COMMENT = "权限表";
-- ai_ecommerce_saas.role DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`role`;
CREATE TABLE `ai_ecommerce_saas`.`role` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT Comment "角色ID",
`name` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "角色名称",
`code` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "角色标识（唯一），如 admin",
`description` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "角色描述",
`status` TINYINT NOT NULL DEFAULT 1 Comment "状态：1=启用，0=禁用",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "逻辑删除：0=未删除，1=已删除",
`create_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP Comment "创建时间",
`update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) Comment "更新时间",
INDEX `idx_deleted`(`deleted` ASC) USING BTREE,
INDEX `idx_status`(`status` ASC) USING BTREE,
UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 3 ROW_FORMAT = Dynamic COMMENT = "角色表";
-- ai_ecommerce_saas.role_permission DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`role_permission`;
CREATE TABLE `ai_ecommerce_saas`.`role_permission` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT Comment "关联ID",
`role_id` BIGINT UNSIGNED NOT NULL Comment "角色ID",
`permission_id` BIGINT UNSIGNED NOT NULL Comment "权限ID",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "逻辑删除：0=未删除，1=已删除",
`create_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP Comment "创建时间",
`update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) Comment "更新时间",
INDEX `idx_deleted`(`deleted` ASC) USING BTREE,
INDEX `idx_permission_id`(`permission_id` ASC) USING BTREE,
INDEX `idx_role_id`(`role_id` ASC) USING BTREE,
UNIQUE INDEX `uk_role_permission`(`role_id` ASC,`permission_id` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 31 ROW_FORMAT = Dynamic COMMENT = "角色权限关联表";
-- ai_ecommerce_saas.sys_user DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`sys_user`;
CREATE TABLE `ai_ecommerce_saas`.`sys_user` (`id` BIGINT NOT NULL AUTO_INCREMENT Comment "用户ID",
`username` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "登录账号",
`password` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "密码（加密）",
`nickname` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "昵称",
`phone` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "手机号",
`email` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "邮箱",
`points` INT NOT NULL DEFAULT 0 Comment "用户积分",
`status` TINYINT NOT NULL DEFAULT 1 Comment "0禁用 1正常",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "0未删 1已删",
`create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 2 ROW_FORMAT = Dynamic COMMENT = "用户表";
-- ai_ecommerce_saas.user_points_log DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`user_points_log`;
CREATE TABLE `ai_ecommerce_saas`.`user_points_log` (`id` BIGINT NOT NULL AUTO_INCREMENT,
`username` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "用户ID",
`change_points` INT NOT NULL Comment "变动积分（+增加 -扣除）",
`current_points` INT NOT NULL Comment "变动后积分",
`remark` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "变动原因",
`create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) Comment "修改时间",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "逻辑删除标识(0-未删除,1-已删除)",
INDEX `idx_user_id`(`username` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 1 ROW_FORMAT = Dynamic COMMENT = "积分变动日志";
-- ai_ecommerce_saas.user_role DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`user_role`;
CREATE TABLE `ai_ecommerce_saas`.`user_role` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT Comment "关联ID",
`user_id` BIGINT UNSIGNED NOT NULL Comment "用户ID，关联 sys_user.id",
`role_id` BIGINT UNSIGNED NOT NULL Comment "角色ID",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "逻辑删除：0=未删除，1=已删除",
`create_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP Comment "创建时间",
`update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) Comment "更新时间",
INDEX `idx_deleted`(`deleted` ASC) USING BTREE,
INDEX `idx_role_id`(`role_id` ASC) USING BTREE,
INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
UNIQUE INDEX `uk_user_role`(`user_id` ASC,`role_id` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 1 ROW_FORMAT = Dynamic COMMENT = "用户角色关联表";
-- ai_ecommerce_saas.permission DML
INSERT INTO `ai_ecommerce_saas`.`permission` (`id`,`parent_id`,`name`,`code`,`type`,`path`,`method`,`status`,`sort`,`deleted`,`create_time`,`update_time`) VALUES (1,0,'文件上传','module:upload',2,NULL,NULL,1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(2,0,'Coze工作流','module:coze',2,NULL,NULL,1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(3,0,'文案生成','module:copywriting',2,NULL,NULL,1,3,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(4,0,'用户管理','module:user',2,NULL,NULL,1,4,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(5,1,'上传文件到Coze','upload:coze',1,'/api/upload/coze','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(6,2,'异步生成视频','coze:workflow:async',1,'/api/coze/workflow/async','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(7,2,'查询视频任务状态','coze:workflow:status',1,'/api/coze/workflow/status/{taskId}','GET',1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(8,3,'同步生成文案','copywriting:generate',1,'/api/copywriting/generate','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(9,3,'异步生成文案','copywriting:generate-async',1,'/api/copywriting/generate-async','POST',1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(10,3,'查询文案任务状态','copywriting:taskStatus',1,'/api/copywriting/task-status/{taskId}','GET',1,3,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(11,4,'用户登录','user:login',1,'/api/admin/user/login','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(12,4,'用户注册','user:register',1,'/api/admin/user/register','POST',1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(13,4,'用户登出','user:logout',1,'/api/admin/user/logout','POST',1,3,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(14,4,'修改用户信息','user:update',1,'/api/admin/user/updateUser','POST',1,4,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(15,4,'获取当前用户信息','user:getInfo',1,'/api/admin/user/getUserByUsername','POST',1,5,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(16,4,'检查用户名是否存在','user:checkUsername',1,'/api/admin/user/checkUsernameExists','POST',1,6,0,'2026-04-01 10:28:53','2026-04-01 10:28:53');
-- ai_ecommerce_saas.role DML
INSERT INTO `ai_ecommerce_saas`.`role` (`id`,`name`,`code`,`description`,`status`,`deleted`,`create_time`,`update_time`) VALUES (1,'管理员','admin','系统管理员，拥有所有权限',1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(2,'普通用户','user','普通用户',1,0,'2026-04-01 10:28:53','2026-04-01 10:55:18');
-- ai_ecommerce_saas.role_permission DML
INSERT INTO `ai_ecommerce_saas`.`role_permission` (`id`,`role_id`,`permission_id`,`deleted`,`create_time`,`update_time`) VALUES (1,1,5,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(2,1,6,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(3,1,7,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(4,1,8,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(5,1,9,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(6,1,10,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(7,1,11,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(8,1,12,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(9,1,13,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(10,1,14,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(11,1,15,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(12,1,16,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(16,2,5,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(17,2,6,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(18,2,7,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(19,2,8,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(20,2,9,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(21,2,10,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(22,2,13,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(23,2,14,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(24,2,15,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(25,2,16,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(26,2,11,0,'2026-04-01 10:49:38','2026-04-01 10:49:39'),(27,2,12,0,'2026-04-01 10:49:54','2026-04-01 10:49:55');
-- ai_ecommerce_saas.sys_user DML
INSERT INTO `ai_ecommerce_saas`.`sys_user` (`id`,`username`,`password`,`nickname`,`phone`,`email`,`points`,`status`,`deleted`,`create_time`,`update_time`) VALUES (1,'test01','$2a$10$Js5Zsvt/C8FsCagQ61JENOA1mLkPvabi9U/G2z/hgRqHxUKCK1MR2','test01','19923051654','2946132340@qq.com',100,1,0,'2026-03-31 13:38:42','2026-04-01 16:02:25'),(2,'test02','$2a$10$Js5Zsvt/C8FsCagQ61JENOA1mLkPvabi9U/G2z/hgRqHxUKCK1MR2','model','123456789','1234567',80,1,0,'2026-04-01 11:13:08','2026-04-01 15:30:54');
-- ai_ecommerce_saas.user_role DML
INSERT INTO `ai_ecommerce_saas`.`user_role` (`id`,`user_id`,`role_id`,`deleted`,`create_time`,`update_time`) VALUES (1,2,2,0,'2026-04-01 11:13:08','2026-04-01 11:13:08');
SET FOREIGN_KEY_CHECKS = 1;
