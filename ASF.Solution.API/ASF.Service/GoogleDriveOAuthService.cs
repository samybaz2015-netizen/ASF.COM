using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Text.RegularExpressions;

public class GoogleDriveOAuthService
{
    private readonly DriveService? _driveService;
    private readonly string? _rootFolderId;
    private readonly bool _isInitialized;
    private readonly string? _initError;

    public GoogleDriveOAuthService(IConfiguration configuration)
    {
        try
        {
            var basePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Credentials");
            var credentialsPath = Path.Combine(basePath, "client_secret.json");
            var tokenStorePath = Path.Combine(basePath, "token_store");

            if (!File.Exists(credentialsPath))
            {
                _initError = $"client_secret.json not found in Credentials folder: {credentialsPath}";
                return;
            }

            UserCredential credential;

            using (var stream = new FileStream(credentialsPath, FileMode.Open, FileAccess.Read))
            {
                credential = GoogleWebAuthorizationBroker.AuthorizeAsync(
                    GoogleClientSecrets.FromStream(stream).Secrets,
                    new[] { DriveService.Scope.Drive },
                    "user",
                    CancellationToken.None,
                    new FileDataStore(tokenStorePath, true)
                ).GetAwaiter().GetResult();
            }

            _driveService = new DriveService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = configuration["GoogleDrive:ApplicationName"] ?? "ASF Consult"
            });

            _rootFolderId = configuration["GoogleDrive:RootFolderId"]
                ?? "1vnXG4Ec05bV1WHW-Q_34dOn28ItJvgcQ";

            _isInitialized = true;
        }
        catch (Exception ex)
        {
            _initError = ex.Message;
        }
    }

    public DriveService GetDriveService() => _driveService ?? throw new InvalidOperationException($"GoogleDriveOAuthService is not initialized: {_initError}");

    /// <summary>
    /// Uploads a file into (optionally) a named subfolder under the configured root folder,
    /// makes it public-readable, and returns a direct-view URL — same return shape as the
    /// old local SaveFile() method used to return.
    /// </summary>
    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (!_isInitialized || _driveService == null || _rootFolderId == null)
            throw new InvalidOperationException($"Google Drive service is not ready: {_initError}");

        // رفع الملفات داخل Photos/{folderName} بنفس هيكل السيرفر القديم
        var photosFolderId = await GetOrCreateFolderAsync("Photos", _rootFolderId);
        var parentId = string.IsNullOrWhiteSpace(folderName)
            ? photosFolderId
            : await GetOrCreateFolderAsync(folderName, photosFolderId);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";

        var fileMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = fileName,
            Parents = new List<string> { parentId }
        };

        using var stream = file.OpenReadStream();
        var request = _driveService.Files.Create(fileMetadata, stream, file.ContentType);
        request.Fields = "id";

        var progress = await request.UploadAsync();
        if (progress.Status != Google.Apis.Upload.UploadStatus.Completed)
            throw new Exception($"فشل رفع الملف: {progress.Exception?.Message}");

        var uploaded = request.ResponseBody;

        await MakeFilePublicAsync(uploaded.Id);

        return $"https://drive.google.com/file/d/{uploaded.Id}/view";
    }

    public async Task MakeFilePublicAsync(string fileId)
    {
        try
        {
            await _driveService.Permissions.Create(
                new Google.Apis.Drive.v3.Data.Permission { Type = "anyone", Role = "reader" },
                fileId
            ).ExecuteAsync();
        }
        catch (Exception)
        {
            // Ignore error to avoid blocking the user flow
        }
    }

    public async Task MakeAllFilesPublicAsync()
    {
        await MakeFolderContentsPublicRecursiveAsync(_rootFolderId);
    }

    private async Task MakeFolderContentsPublicRecursiveAsync(string folderId)
    {
        await MakeFilePublicAsync(folderId);

        string? nextPageToken = null;
        do
        {
            var listRequest = _driveService.Files.List();
            listRequest.Q = $"'{folderId}' in parents and trashed = false";
            listRequest.Fields = "nextPageToken, files(id, name, mimeType)";
            listRequest.PageSize = 100;
            listRequest.PageToken = nextPageToken;

            var result = await listRequest.ExecuteAsync();
            if (result.Files != null)
            {
                foreach (var file in result.Files)
                {
                    await MakeFilePublicAsync(file.Id);
                    if (file.MimeType == "application/vnd.google-apps.folder")
                    {
                        await MakeFolderContentsPublicRecursiveAsync(file.Id);
                    }
                }
            }
            nextPageToken = result.NextPageToken;
        } while (nextPageToken != null);
    }

    /// <summary>
    /// يبحث عن ملف داخل Photos/{subFolder} في Drive عن طريق اسم الملف
    /// ويرجع Drive URL مباشر، أو null لو مش موجود.
    /// يُستخدم لتحويل الـ URLs القديمة /Photos/folder/file.ext للـ Drive URLs.
    /// </summary>
    public async Task<string?> GetPhotosDriveUrlAsync(string subFolder, string fileName)
    {
        // ابحث عن Photos folder
        var photosListReq = _driveService.Files.List();
        photosListReq.Q = $"mimeType='application/vnd.google-apps.folder' and name='Photos' and '{_rootFolderId}' in parents and trashed=false";
        photosListReq.Fields = "files(id)";
        var photosResult = (await photosListReq.ExecuteAsync()).Files.FirstOrDefault();
        if (photosResult == null) return null;

        // ابحث عن subfolder داخل Photos
        var subListReq = _driveService.Files.List();
        subListReq.Q = $"mimeType='application/vnd.google-apps.folder' and name='{subFolder}' and '{photosResult.Id}' in parents and trashed=false";
        subListReq.Fields = "files(id)";
        var subResult = (await subListReq.ExecuteAsync()).Files.FirstOrDefault();
        if (subResult == null) return null;

        // ابحث عن الملف بالاسم داخل الـ subfolder
        var fileListReq = _driveService.Files.List();
        fileListReq.Q = $"name='{fileName}' and '{subResult.Id}' in parents and trashed=false";
        fileListReq.Fields = "files(id)";
        var fileResult = (await fileListReq.ExecuteAsync()).Files.FirstOrDefault();
        if (fileResult == null) return null;

        await MakeFilePublicAsync(fileResult.Id);

        return $"https://drive.google.com/file/d/{fileResult.Id}/view";

    }

    public async Task<string> GetOrCreateFolderAsync(string folderName, string parentFolderId)
    {
        var listRequest = _driveService.Files.List();
        listRequest.Q = $"mimeType='application/vnd.google-apps.folder' and name='{folderName}' and '{parentFolderId}' in parents and trashed = false";
        listRequest.Fields = "files(id, name)";

        var existing = (await listRequest.ExecuteAsync()).Files.FirstOrDefault();
        if (existing != null)
            return existing.Id;

        var folderMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = folderName,
            MimeType = "application/vnd.google-apps.folder",
            Parents = new List<string> { parentFolderId }
        };

        var request = _driveService.Files.Create(folderMetadata);
        request.Fields = "id";

        var folder = await request.ExecuteAsync();
        return folder.Id;
    }

    public async Task DeleteFileAsync(string fileId)
    {
        await _driveService.Files.Delete(fileId).ExecuteAsync();
    }

    public async Task DeleteImageByUrlAsync(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl) || !imageUrl.Contains("drive.google.com"))
            return;

        var fileId = ExtractDriveFileId(imageUrl);
        if (!string.IsNullOrEmpty(fileId))
            await DeleteFileAsync(fileId);
    }

    public string? ExtractDriveFileId(string url)
    {
        var match = Regex.Match(url, @"[-\w]{25,}");
        return match.Success ? match.Value : null;
    }
}