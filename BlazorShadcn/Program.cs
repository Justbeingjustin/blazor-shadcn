using Microsoft.AspNetCore.HttpOverrides;

using BlazorShadcn.Components;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost;

    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();
var frameworkScriptResolver = new FrameworkScriptResolver();

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAntiforgery();

app.MapGet("/_framework/{fileName}", (string fileName) =>
{
    if (!fileName.Equals("blazor.server.js", StringComparison.OrdinalIgnoreCase) &&
        !fileName.Equals("blazor.web.js", StringComparison.OrdinalIgnoreCase))
    {
        return Results.NotFound();
    }

    var scriptPath = frameworkScriptResolver.Resolve(fileName);
    return scriptPath is null
        ? Results.NotFound()
        : Results.File(scriptPath, "text/javascript");
});

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

file sealed class FrameworkScriptResolver
{
    private readonly Dictionary<string, string?> _cache = new(StringComparer.OrdinalIgnoreCase);

    public string? Resolve(string fileName)
    {
        if (_cache.TryGetValue(fileName, out var cachedPath))
        {
            return cachedPath;
        }

        var appBase = AppContext.BaseDirectory;
        var directCandidates = new[]
        {
            Path.Combine(appBase, "wwwroot", "_framework", fileName),
            Path.Combine("/root/.nuget/packages/microsoft.aspnetcore.app.internal.assets", "_framework", fileName)
        };

        foreach (var candidate in directCandidates)
        {
            if (File.Exists(candidate))
            {
                _cache[fileName] = candidate;
                return candidate;
            }
        }

        foreach (var root in new[]
                 {
                     Path.Combine(appBase, ".nuget"),
                     "/root/.nuget/packages/microsoft.aspnetcore.app.internal.assets",
                     "/usr/share/dotnet"
                 })
        {
            if (!Directory.Exists(root))
            {
                continue;
            }

            var match = Directory.EnumerateFiles(root, fileName, SearchOption.AllDirectories)
                .FirstOrDefault(path => path.Contains($"{Path.DirectorySeparatorChar}_framework{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase));

            if (match is not null)
            {
                _cache[fileName] = match;
                return match;
            }
        }

        _cache[fileName] = null;
        return null;
    }
}
