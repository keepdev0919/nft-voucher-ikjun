package com.ssafy.ttocket.service;

import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ssafy.ttocket.dto.ResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileService {
    private final AmazonS3Client amazonS3Client;

    private String S3Bucket = "moonrise";
    public ResponseDto upload(MultipartFile[] multipartFileList){
        List<String> imagePathList = new ArrayList<>();
        ResponseDto responseDto = new ResponseDto();
        try {
            for (MultipartFile multipartFile : multipartFileList) {
                String originalName = multipartFile.getOriginalFilename();
                UUID uuid = UUID.randomUUID();
                System.out.println("uuid = " + uuid);
                String newFileName = uuid + "_" + originalName;

                //파일 크기
                long size = multipartFile.getSize();

                ObjectMetadata objectMetadata = new ObjectMetadata();
                objectMetadata.setContentType(multipartFile.getContentType());
                objectMetadata.setContentLength(size);

                // s3에 업로드
                amazonS3Client.putObject(
                        new PutObjectRequest(S3Bucket, newFileName, multipartFile.getInputStream(), objectMetadata)
                                .withCannedAcl(CannedAccessControlList.PublicRead)
                );
                String imagePath = amazonS3Client.getUrl(S3Bucket, newFileName).toString(); // 접근가능한 URL 가져오기
                log.info("imagePath : {}", imagePath);
                imagePathList.add(imagePath);

                responseDto.setBody(imagePathList);
                responseDto.setMessage("이미지 업로드 완료");
                responseDto.setStatusCode(200);
            }
        }catch (IOException ioException) {
            log.error(ioException.getMessage());
            responseDto.setStatusCode(400);
            responseDto.setMessage("이미지 업로드 실패");
        }

        return responseDto;
    }
}
