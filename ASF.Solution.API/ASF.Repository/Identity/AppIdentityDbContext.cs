using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Repository.Identity
{
    public class AppIdentityDbContext : IdentityDbContext<AppUser>
    {
        public AppIdentityDbContext(DbContextOptions<AppIdentityDbContext> options) : base(options)
        {

        }

        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<EmployeeDocument> EmployeeDocuments { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // مستندات الموظف: البحث يكون دائماً بصاحب المستند، ثم بنوعه.
            builder.Entity<EmployeeDocument>(b =>
            {
                b.HasIndex(d => d.UserId);
                b.HasIndex(d => new { d.UserId, d.Kind });
                b.Property(d => d.SizeBytes).HasDefaultValue(0L);
            });

            // لا يُمنح الدور نفس الصلاحية مرتين
            builder.Entity<RolePermission>()
                .HasIndex(rp => new { rp.RoleId, rp.PermissionName })
                .IsUnique();

            // ولا يحمل المستخدم سطرين لنفس الصلاحية، فالمنع والسماح على نفس السطر
            builder.Entity<UserPermission>()
                .HasIndex(up => new { up.UserId, up.PermissionName })
                .IsUnique();
        }



    }


}
