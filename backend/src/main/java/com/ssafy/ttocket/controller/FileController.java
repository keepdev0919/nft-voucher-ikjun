package com.ssafy.ttocket.controller;

import com.ssafy.ttocket.dto.ResponseDto;
import com.ssafy.ttocket.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "파일", description = "파일 관련 API")
@RestController
@Slf4j
@RequestMapping("/image")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @Operation(summary = "파일", description = "블록체인 파일 관련 API")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "400", description = "bad request operation")
    })
    @PostMapping("/upload")
    public ResponseEntity<?> imageUpload(MultipartFile[] files){
        log.debug("FileController-Post-/image/upload filesize : {}", files.length);
        ResponseDto responseDto = fileService.upload(files);

        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }
}