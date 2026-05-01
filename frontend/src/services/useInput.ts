import { useState } from "react";

type UseInputReturnType = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | undefined;
};

const useInput = (
  initialValue: string,
  required: boolean = false
): UseInputReturnType => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (required && e.target.value.trim() === "") {
      setError("필수 입력 항목입니다.");
    } else {
      setError(undefined);
    }
  };

  return { value, onChange: handleChange, error };
};

export default useInput;
