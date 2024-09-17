# Test surveys

### Reusability : Lets try to use exiting survey if we can

| Transaction ID | Purpose                         | Used By    | Description                                                                                                                                                                      |
|----------------|---------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 5000056        | Test layout plan sheet          | API and EF | This survey is used to test save functionality of layout plan sheet                                                                                                              |
| 5000057        |                                 | API and FE | This survey is used to test define diagrams draw functionality                                                                                                                   |
| 5000058        |                                 | FE         | This survey is duplicate of 5000057 to run pw test in case it fails in first attempt and pw run it again using retry#1 in define diagrams draw functionality test                |
| 5000059        | plan sheet compare with legacy  | FE         | This survey SO 598018 is for simple layout plans sheet comparison with legacy   (copy of transactionId - 2287884 in kartoffel under jgutsell001)                                 |
| 5000060        | plan sheet compare with legacy  | FE         | This survey LT 4000331 is for layout plans sheet comparison with legacy which has both irregular lines and an arc  (copy of transactionId - 2288511 in kumara under jgutsell001) |


<span style="color:red">
Note:- If you are modifying existing survey which is being used for API as well please update it in API repo also
</span>
