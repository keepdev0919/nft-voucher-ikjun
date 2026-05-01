import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const name = 'user'

interface User {
    nickname : string | any;
    id : string | any; 
}

const initialState : User = {
    nickname : "",
    id : "",
}

export const userSlice = createSlice({
    name,
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.nickname = action.payload.nickname;
            state.id = action.payload.id;
          },
        setNickName: (state, action: PayloadAction<string>) => {
              state.nickname = action.payload;
            },
        setId: (state, action: PayloadAction<string>) => {
              state.id = action.payload;
            },
        },
        extraReducers: {},
})

export const { setNickName, setId, setUser } = userSlice.actions;