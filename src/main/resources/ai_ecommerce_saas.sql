SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
-- ai_ecommerce_saas DDL
CREATE DATABASE `ai_ecommerce_saas`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;;
use `ai_ecommerce_saas`;
-- ai_ecommerce_saas.payment_order DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`payment_order`;
CREATE TABLE `ai_ecommerce_saas`.`payment_order` (`id` BIGINT NOT NULL AUTO_INCREMENT Comment "订单ID",
`order_no` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "商户订单号",
`user_id` BIGINT NOT NULL Comment "用户ID",
`openid` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "用户微信openid",
`amount` INT NOT NULL Comment "支付金额（分）",
`body` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "商品描述",
`pay_type` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'WECHAT' Comment "支付方式：WECHAT-微信支付",
`status` TINYINT NOT NULL DEFAULT 0 Comment "支付状态：0-待支付，1-支付成功，2-支付失败，3-已关闭",
`prepay_id` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "微信预支付ID",
`transaction_id` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "微信支付订单号",
`pay_time` DATETIME NULL Comment "支付完成时间",
`notify_result` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "支付回调结果",
`product_type` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "产品类型：MEMBER-会员购买，POINTS_PACKAGE-积分加油包",
`product_code` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "产品编码（会员等级或加油包类型）",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "逻辑删除：0=未删除，1=已删除",
`create_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP Comment "创建时间",
`update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) Comment "更新时间",
INDEX `idx_order_no`(`order_no` ASC) USING BTREE,
INDEX `idx_status`(`status` ASC) USING BTREE,
INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 1 ROW_FORMAT = Dynamic COMMENT = "支付订单表";
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
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 20 ROW_FORMAT = Dynamic COMMENT = "权限表";
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
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 30 ROW_FORMAT = Dynamic COMMENT = "角色权限关联表";
-- ai_ecommerce_saas.sys_user DDL
DROP TABLE IF EXISTS `ai_ecommerce_saas`.`sys_user`;
CREATE TABLE `ai_ecommerce_saas`.`sys_user` (`id` BIGINT NOT NULL AUTO_INCREMENT Comment "用户ID",
`openid` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "微信小程序openid",
`username` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "登录账号",
`password` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL Comment "密码（加密）",
`nickname` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "昵称",
`phone` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "手机号",
`email` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL Comment "邮箱",
`points` INT NOT NULL DEFAULT 0 Comment "用户积分",
`status` TINYINT NOT NULL DEFAULT 1 Comment "0禁用 1正常",
`member_level` TINYINT NOT NULL DEFAULT 0 Comment "会员等级：0-普通用户，1-体验会员，2-VIP，3-SVIP",
`member_expire_time` DATETIME NULL Comment "会员到期时间",
`deleted` TINYINT NOT NULL DEFAULT 0 Comment "0未删 1已删",
`create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
INDEX `idx_openid`(`openid` ASC) USING BTREE,
INDEX `idx_member_level`(`member_level` ASC) USING BTREE,
UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 9 ROW_FORMAT = Dynamic COMMENT = "用户表";
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
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 29 ROW_FORMAT = Dynamic COMMENT = "积分变动日志";
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
PRIMARY KEY (`id`)) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci AUTO_INCREMENT = 9 ROW_FORMAT = Dynamic COMMENT = "用户角色关联表";
-- ai_ecommerce_saas.permission DML
INSERT INTO `ai_ecommerce_saas`.`permission` (`id`,`parent_id`,`name`,`code`,`type`,`path`,`method`,`status`,`sort`,`deleted`,`create_time`,`update_time`) VALUES (1,0,'文件上传','module:upload',2,NULL,NULL,1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(2,0,'Coze工作流','module:coze',2,NULL,NULL,1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(3,0,'文案生成','module:copywriting',2,NULL,NULL,1,3,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(4,0,'用户管理','module:user',2,NULL,NULL,1,4,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(5,1,'上传文件到Coze','upload:coze',1,'/api/upload/coze','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(6,2,'异步生成视频','coze:workflow:async',1,'/api/coze/workflow/async','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(7,2,'查询视频任务状态','coze:workflow:status',1,'/api/coze/workflow/status/{taskId}','GET',1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(8,3,'同步生成文案','copywriting:generate',1,'/api/copywriting/generate','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(9,3,'异步生成文案','copywriting:generate-async',1,'/api/copywriting/generate-async','POST',1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(10,3,'查询文案任务状态','copywriting:taskStatus',1,'/api/copywriting/task-status/{taskId}','GET',1,3,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(11,4,'用户登录','user:login',1,'/api/admin/user/login','POST',1,1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(12,4,'用户注册','user:register',1,'/api/admin/user/register','POST',1,2,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(13,4,'用户登出','user:logout',1,'/api/admin/user/logout','POST',1,3,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(14,4,'修改用户信息','user:update',1,'/api/admin/user/updateUser','POST',1,4,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(15,4,'获取当前用户信息','user:getInfo',1,'/api/admin/user/getUserByUsername','POST',1,5,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(16,4,'检查用户名是否存在','user:checkUsername',1,'/api/admin/user/checkUsernameExists','POST',1,6,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(19,4,'查询用户积分','user:getPointInfo',1,'/api/admin/points-log/page','GET',1,7,0,'2026-04-03 09:23:31','2026-04-03 09:23:31');
-- ai_ecommerce_saas.role DML
INSERT INTO `ai_ecommerce_saas`.`role` (`id`,`name`,`code`,`description`,`status`,`deleted`,`create_time`,`update_time`) VALUES (1,'管理员','admin','系统管理员，拥有所有权限',1,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(2,'普通用户','user','普通用户',1,0,'2026-04-01 10:28:53','2026-04-01 10:55:18');
-- ai_ecommerce_saas.role_permission DML
INSERT INTO `ai_ecommerce_saas`.`role_permission` (`id`,`role_id`,`permission_id`,`deleted`,`create_time`,`update_time`) VALUES (1,1,5,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(2,1,6,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(3,1,7,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(4,1,8,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(5,1,9,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(6,1,10,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(7,1,11,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(8,1,12,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(9,1,13,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(10,1,14,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(11,1,15,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(12,1,16,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(16,2,5,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(17,2,6,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(18,2,7,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(19,2,8,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(20,2,9,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(21,2,10,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(22,2,13,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(23,2,14,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(24,2,15,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(25,2,16,0,'2026-04-01 10:28:53','2026-04-01 10:28:53'),(26,2,11,0,'2026-04-01 10:49:38','2026-04-01 10:49:39'),(27,2,12,0,'2026-04-01 10:49:54','2026-04-01 10:49:55'),(28,1,19,0,'2026-04-03 09:27:01','2026-04-03 09:27:01'),(29,2,19,0,'2026-04-03 09:27:08','2026-04-03 09:27:08');
-- ai_ecommerce_saas.sys_user DML
INSERT INTO `ai_ecommerce_saas`.`sys_user` (`id`,`openid`,`username`,`password`,`nickname`,`phone`,`email`,`points`,`status`,`member_level`,`member_expire_time`,`deleted`,`create_time`,`update_time`) VALUES (1,NULL,'test01','$2a$10$Js5Zsvt/C8FsCagQ61JENOA1mLkPvabi9U/G2z/hgRqHxUKCK1MR2','test01','19923051654','2946132340@qq.com',70,1,0,NULL,0,'2026-03-31 13:38:42','2026-04-01 16:02:25'),(2,NULL,'test02','$2a$10$Js5Zsvt/C8FsCagQ61JENOA1mLkPvabi9U/G2z/hgRqHxUKCK1MR2','李斯','123456789','1234567',80,1,0,NULL,0,'2026-04-01 11:13:08','2026-04-03 09:06:11'),(3,NULL,'1','$2a$10$YLC0hmXoqs2Ki0o9cXedBuZVI10S757UNAMITc7esewIp3IlFfmha','管','13800138000','admin@example.com',200,1,0,NULL,0,'2026-04-01 17:27:53','2026-04-01 17:27:53'),(4,NULL,'test03','$2a$10$6dDMD8ZTG48RRUOtDNltSO5Kj.ZKlMKrX.ysc60nO0SntThQdeXjW','管理员','13800138000','admin@example.com',70,1,0,NULL,0,'2026-04-02 09:12:46','2026-04-02 09:12:46'),(5,NULL,'test004','$2a$10$xtNiXZ1wTe8iZaXrqrQBPe2QWRBhA56b5eTof5xjWtR7n7NuXM5Q6','管理员','13800138000','admin@example.com',100,1,0,NULL,0,'2026-04-02 09:19:24','2026-04-02 09:19:24'),(6,NULL,'test04','$2a$10$CrMyXc3NgUQ0P.RBn8HnKOy1Zbb0nP6RUDc5d90caS3zy.KTu8U7i','管理员','13800138000','admin@example.com',100,1,0,NULL,0,'2026-04-02 09:21:44','2026-04-02 09:21:44'),(7,NULL,'test05','$2a$10$DY3ASCbbG762WyOH4XuVQO52CIVfr4NeqqfgRBQJ2TQ/pcFLzRw2G','用户37891','13800138000','admin@example.com',100,1,0,NULL,0,'2026-04-02 09:26:07','2026-04-02 09:26:07'),(8,NULL,'test06','$2a$10$54Fs4JhdVFK/67FQ3.cPOuQN8l/2zFVjXPzm3zIp7362FZtEZD5bW','管理员','13800138000','admin@example.com',100,1,0,NULL,0,'2026-04-03 09:41:57','2026-04-03 09:41:57');
-- ai_ecommerce_saas.user_points_log DML
INSERT INTO `ai_ecommerce_saas`.`user_points_log` (`id`,`username`,`change_points`,`current_points`,`remark`,`create_time`,`update_time`,`deleted`) VALUES (5,'test01',-10,90,'视频生成功能消耗积分','2026-04-01 17:11:44','2026-04-01 17:11:44',0),(6,'test01',-10,90,'积分减少：10, 当前积分：90','2026-04-01 17:11:44','2026-04-01 17:11:44',0),(7,'test01',-5,85,'小红书文案生成功能消耗积分','2026-04-01 17:11:44','2026-04-01 17:11:44',0),(8,'test01',-5,85,'积分减少：5, 当前积分：85','2026-04-01 17:11:44','2026-04-01 17:11:44',0),(9,'test01',-10,75,'视频生成功能消耗积分','2026-04-01 17:13:44','2026-04-01 17:13:44',0),(10,'test01',-10,75,'积分减少：10, 当前积分：75','2026-04-01 17:13:44','2026-04-01 17:13:44',0),(11,'test01',-5,70,'小红书文案生成功能消耗积分','2026-04-01 17:13:44','2026-04-01 17:13:44',0),(12,'test01',-5,70,'积分减少：5, 当前积分：70','2026-04-01 17:13:44','2026-04-01 17:13:44',0),(13,'1',100,200,'新用户注册奖励积分','2026-04-01 17:27:53','2026-04-01 17:27:53',0),(14,'1',100,200,'积分增加：100, 当前积分：200','2026-04-01 17:27:53','2026-04-01 17:27:53',0),(15,'test03',100,100,'新用户注册奖励积分','2026-04-02 09:12:46','2026-04-02 09:12:46',0),(16,'test03',100,100,'积分增加：100, 当前积分：100','2026-04-02 09:12:46','2026-04-02 09:12:46',0),(17,'test03',-10,90,'视频生成功能消耗积分','2026-04-02 09:15:05','2026-04-02 09:15:05',0),(18,'test03',-10,90,'积分减少：10, 当前积分：90','2026-04-02 09:15:05','2026-04-02 09:15:05',0),(19,'test03',-5,85,'小红书文案生成功能消耗积分','2026-04-02 09:15:05','2026-04-02 09:15:05',0),(20,'test03',-5,85,'积分减少：5, 当前积分：85','2026-04-02 09:15:05','2026-04-02 09:15:05',0),(21,'test004',100,100,'新用户注册奖励积分','2026-04-02 09:19:24','2026-04-02 09:19:24',0),(22,'test004',100,100,'积分增加：100, 当前积分：100','2026-04-02 09:19:24','2026-04-02 09:19:24',0),(23,'test04',100,100,'新用户注册奖励积分','2026-04-02 09:22:15','2026-04-02 09:22:15',0),(24,'test04',100,100,'积分增加：100, 当前积分：100','2026-04-02 09:22:15','2026-04-02 09:22:15',0),(25,'test05',100,100,'新用户注册奖励积分','2026-04-02 09:26:07','2026-04-02 09:26:07',0),(26,'test03',-10,75,'视频生成功能消耗积分','2026-04-02 09:36:33','2026-04-02 09:36:33',0),(27,'test03',-5,70,'小红书文案生成功能消耗积分','2026-04-02 09:38:06','2026-04-02 09:38:06',0),(28,'test06',100,100,'新用户注册奖励积分','2026-04-03 09:41:57','2026-04-03 09:41:57',0);
-- ai_ecommerce_saas.user_role DML
INSERT INTO `ai_ecommerce_saas`.`user_role` (`id`,`user_id`,`role_id`,`deleted`,`create_time`,`update_time`) VALUES (1,2,2,0,'2026-04-01 11:13:08','2026-04-01 11:13:08'),(2,1,1,0,'2026-04-01 16:57:09','2026-04-01 16:57:09'),(3,3,2,0,'2026-04-01 17:27:53','2026-04-01 17:27:53'),(4,4,2,0,'2026-04-02 09:12:46','2026-04-02 09:12:46'),(5,5,2,0,'2026-04-02 09:19:24','2026-04-02 09:19:24'),(6,6,2,0,'2026-04-02 09:22:31','2026-04-02 09:22:31'),(7,7,2,0,'2026-04-02 09:26:07','2026-04-02 09:26:07'),(8,8,2,0,'2026-04-03 09:41:57','2026-04-03 09:41:57');
SET FOREIGN_KEY_CHECKS = 1;
