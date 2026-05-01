package com.ssafy.ttocket.domain;

import com.sun.istack.NotNull;
import lombok.*;

import javax.persistence.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @Column(name="user_id")
    private String id;

    @NotNull
    @Column(name="user_nickname")
    private String nickname;
}
