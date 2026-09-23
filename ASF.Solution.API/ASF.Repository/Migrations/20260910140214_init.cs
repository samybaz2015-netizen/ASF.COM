using Microsoft.EntityFrameworkCore.Migrations;



#nullable disable

namespace ASF.Repository.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "PrivateProjects");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "PrivateProjectDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "NewProjectDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "MaintenanceDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "EmergencyDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "ConstructionDeleted");
        }
    }
}
