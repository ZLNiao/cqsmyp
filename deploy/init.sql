-- GlamUp 数据库初始化
CREATE DATABASE IF NOT EXISTS glamup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE glamup;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(64) DEFAULT '',
    avatar VARCHAR(255) DEFAULT '',
    is_vip TINYINT(1) DEFAULT 0,
    vip_expiry DATETIME NULL,
    is_admin TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS analyses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_url VARCHAR(500),
    face_shape VARCHAR(32),
    skin_tone VARCHAR(64),
    result_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    plan VARCHAR(32) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT 'pending',
    pay_method ENUM('wechat', 'alipay', 'apple_iap') NOT NULL,
    transaction_id VARCHAR(128),
    paid_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status_created (status, created_at)
) ENGINE=InnoDB;

-- 明星人脸库元信息
-- 实际人脸特征存在百度 AI 的 FaceSet 中，这里只存元信息
-- user_id 字段对应百度 FaceSet 中的 user_id（用百度规则：字母/数字/下划线，最长 128）
CREATE TABLE IF NOT EXISTS celebrities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    baidu_user_id VARCHAR(128) UNIQUE NOT NULL COMMENT '百度 FaceSet 中的 user_id',
    name VARCHAR(64) NOT NULL,
    emoji VARCHAR(8) DEFAULT '👩',
    bg VARCHAR(255) DEFAULT 'linear-gradient(135deg, #FBCFE8, #F472B6)',
    face_shape VARCHAR(32) COMMENT '脸型，便于按脸型分组展示',
    image_url VARCHAR(500) COMMENT '原图 URL，用于头像显示',
    enabled TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_face_shape (face_shape),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB;

-- 默认管理员（密码：admin123，生产环境务必改！）
-- bcrypt('admin123') = $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    real_name VARCHAR(64),
    role ENUM('super', 'normal') DEFAULT 'normal',
    last_login_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 初始管理员账号（用户名: admin, 密码: admin123, 上线请立即改）
INSERT IGNORE INTO admin_users (username, password_hash, real_name, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '超级管理员', 'super');
