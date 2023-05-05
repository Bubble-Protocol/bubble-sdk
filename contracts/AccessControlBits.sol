// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

uint constant BUBBLE_TERMINATED_BIT = 1 << 255;
uint constant DIRECTORY_BIT = 1 << 254;
uint constant READ_BIT = 1 << 253;
uint constant WRITE_BIT = 1 << 252;
uint constant APPEND_BIT = 1 << 251;
uint constant EXECUTE_BIT = 1 << 250;
uint constant ALL_PERMISSIONS = 15 << 250;
uint constant NO_PERMISSIONS = 0;
