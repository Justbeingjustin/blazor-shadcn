FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Install Node.js because the Blazor project builds Tailwind CSS during publish.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg unzip \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY BlazorShadcn/BlazorShadcn.csproj BlazorShadcn/
COPY BlazorShadcn/package.json BlazorShadcn/package.json
COPY BlazorShadcn/package-lock.json BlazorShadcn/package-lock.json

RUN dotnet restore BlazorShadcn/BlazorShadcn.csproj
RUN npm ci --prefix BlazorShadcn

COPY BlazorShadcn/ BlazorShadcn/

RUN dotnet publish BlazorShadcn/BlazorShadcn.csproj -c Release -o /app/publish --no-restore
RUN mkdir -p /app/publish/wwwroot/_framework \
    && ASPNETCORE_VERSION="$(dotnet --list-runtimes | awk '/Microsoft.AspNetCore.App / { print $2; exit }')" \
    && curl -fsSL -o /tmp/aspnetcore-assets.nupkg "https://api.nuget.org/v3-flatcontainer/microsoft.aspnetcore.app.internal.assets/${ASPNETCORE_VERSION}/microsoft.aspnetcore.app.internal.assets.${ASPNETCORE_VERSION}.nupkg" \
    && unzip -j /tmp/aspnetcore-assets.nupkg "_framework/blazor.server.js" "_framework/blazor.web.js" -d /app/publish/wwwroot/_framework \
    && rm -f /tmp/aspnetcore-assets.nupkg \
    && echo "--- publish framework files ---" \
    && ls -la /app/publish/wwwroot/_framework || true

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_HTTP_PORTS=8080

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "BlazorShadcn.dll"]
