package com.ssafy.ttocket.controller;

import com.ssafy.ttocket.dto.ResponseDto;
import com.ssafy.ttocket.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Log4j2
public class UserController {
    private final UserService userService;

    @GetMapping("/check/{userId}")
    public ResponseEntity<ResponseDto> checkUser(@PathVariable String userId){
        log.info("지갑 계정 등록 여부 요청 GET: /{userId} ", userId);
        ResponseDto responseDto = userService.checkUser(userId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @GetMapping("/make/{userId}/{nickname}")
    public ResponseEntity<ResponseDto> makeUser(@PathVariable String userId, @PathVariable String nickname){
        log.info("지갑 계정 닉네임 등록 요청 GET: /{userId}/{nickname} ", userId, nickname);
        ResponseDto responseDto = userService.makeUser(userId,nickname);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }
}
