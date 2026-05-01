package com.ssafy.ttocket.service;

import com.ssafy.ttocket.domain.User;
import com.ssafy.ttocket.dto.ResponseDto;
import com.ssafy.ttocket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public ResponseDto checkUser(String userId) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();

        Optional<User> byId = userRepository.findById(userId);

        if(byId.isEmpty()){
            responseDto.setMessage("회원가입 필요");
            responseDto.setStatusCode(400);
        }
        else{
            responseDto.setMessage("기존 유저");
            responseDto.setBody(byId.get().getNickname());
            responseDto.setStatusCode(200);
        }
        return responseDto;
    }

    public ResponseDto makeUser(String userId, String nickname) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();

        User user = User.builder()
                .id(userId)
                .nickname(nickname)
                .build();

        userRepository.save(user);

        result.put("userInfo",user);
        responseDto.setMessage("유저 입력 완료");
        responseDto.setStatusCode(200);
        return responseDto;
    }
}
