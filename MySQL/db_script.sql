-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`User` (
  `user_id` CHAR(7) NOT NULL,
  `user_email` VARCHAR(50) NOT NULL,
  `user_fname` VARCHAR(30) NOT NULL,
  `user_lname` VARCHAR(30) NOT NULL,
  `user_password` VARCHAR(20) NOT NULL,
  `user_tel` VARCHAR(12) NOT NULL,
  `user_gender` CHAR(1) NULL,
  `User_user_id` CHAR(7) NOT NULL,
  `User_user_id1` CHAR(7) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  INDEX `fk_User_User_idx` (`User_user_id1` ASC) VISIBLE,
  CONSTRAINT `fk_User_User`
    FOREIGN KEY (`User_user_id1`)
    REFERENCES `mydb`.`User` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Menu`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Menu` (
  `menu_id` CHAR(7) NOT NULL,
  `menu_name` VARCHAR(50) NOT NULL,
  `menu_description` TEXT NOT NULL,
  `menu_recipe` TEXT NOT NULL,
  `menu_datetime` DATE NULL,
  `menu_image` VARCHAR(255) NOT NULL,
  `user_id` CHAR(7) NULL,
  `category_id` CHAR(7) NULL,
  PRIMARY KEY (`menu_id`),
  UNIQUE INDEX `menu_id_UNIQUE` (`menu_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Category` (
  `category_id` CHAR(7) NOT NULL,
  `category_name` VARCHAR(50) NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE INDEX `category_id_UNIQUE` (`category_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`MenuRecommend`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`MenuRecommend` (
  `menu_id` CHAR(7) NOT NULL,
  `category_id` CHAR(7) NOT NULL,
  PRIMARY KEY (`menu_id`, `category_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Favorite`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Favorite` (
  `favorite_id` CHAR(7) NOT NULL,
  `favorite_datetime` DATE NULL,
  `user_id` CHAR(7) NULL,
  `category_id` CHAR(7) NULL,
  PRIMARY KEY (`favorite_id`),
  UNIQUE INDEX `favorite_id_UNIQUE` (`favorite_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Admin`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Admin` (
  `admin_id` CHAR(7) NOT NULL,
  `admin_fname` VARCHAR(30) NULL,
  `admin_lname` VARCHAR(30) NULL,
  `admin_password` VARCHAR(20) NULL,
  `comment_id` CHAR(7) NULL,
  `notification_id` CHAR(7) NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE INDEX `admin_id_UNIQUE` (`admin_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Notifiation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Notifiation` (
  `notification_id` CHAR(7) NOT NULL,
  `n_massage` VARCHAR(30) NULL,
  `n_type` VARCHAR(30) NULL,
  `n_datetime` DATE NULL,
  `user_id` CHAR(7) NULL,
  PRIMARY KEY (`notification_id`),
  UNIQUE INDEX `notification_id_UNIQUE` (`notification_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`CommunityPost`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`CommunityPost` (
  `cpost_id` INT NOT NULL,
  `cpost_title` VARCHAR(255) NULL,
  `cpost_content` VARCHAR(255) NULL,
  `cpost_image` VARCHAR(255) NULL,
  `cpost_datetime` DATE NULL,
  `user_id` CHAR(7) NULL,
  PRIMARY KEY (`cpost_id`),
  UNIQUE INDEX `cpost_id_UNIQUE` (`cpost_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`CommunityComment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`CommunityComment` (
  `comment_id` CHAR(7) NOT NULL,
  `comment_content` TEXT NULL,
  `comment_datetime` BLOB NULL,
  `cpost_id` CHAR(7) NULL,
  `user_id` CHAR(7) NULL,
  PRIMARY KEY (`comment_id`),
  UNIQUE INDEX `comment_id_UNIQUE` (`comment_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`CommunityReport`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`CommunityReport` (
  `creport_id` CHAR(7) NOT NULL,
  `creport_reason` VARCHAR(255) NULL,
  `creport_datetime` DATE NULL,
  `creport_id` CHAR(7) NULL,
  `user_id` CHAR(7) NULL,
  PRIMARY KEY (`creport_id`),
  UNIQUE INDEX `creport_id_UNIQUE` (`creport_id` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Chatbot`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Chatbot` (
  `message_id` INT NOT NULL,
  `message_text` VARCHAR(255) NOT NULL,
  `mreply_text` VARCHAR(255) NULL,
  `user_id` CHAR(7) NULL,
  PRIMARY KEY (`message_id`),
  UNIQUE INDEX `message_id_UNIQUE` (`message_id` ASC) VISIBLE)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
