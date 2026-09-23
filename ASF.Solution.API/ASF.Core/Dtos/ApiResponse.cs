namespace ASF.Core.Helpers
{
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        // ✅ أضف الخاصية دي عشان تدعم الـ pagination
        public int? TotalCount { get; set; }

        public bool Success => StatusCode >= 200 && StatusCode < 300;

        public ApiResponse(int statusCode, string? message = null, T? data = default)
        {
            StatusCode = statusCode;
            Message = message;
            Data = data;
        }
    }
}
