using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamWorkload.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskChangeRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaskChangeRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TaskId = table.Column<int>(type: "int", nullable: false),
                    RequestedById = table.Column<int>(type: "int", nullable: false),
                    CurrentAssignedMemberId = table.Column<int>(type: "int", nullable: true),
                    NewAssignedMemberId = table.Column<int>(type: "int", nullable: true),
                    CurrentDueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NewDueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CurrentEstimatedEffortHours = table.Column<int>(type: "int", nullable: false),
                    NewEstimatedEffortHours = table.Column<int>(type: "int", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedById = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskChangeRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskChangeRequests_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskChangeRequests_Users_CurrentAssignedMemberId",
                        column: x => x.CurrentAssignedMemberId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskChangeRequests_Users_NewAssignedMemberId",
                        column: x => x.NewAssignedMemberId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskChangeRequests_Users_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskChangeRequests_Users_ReviewedById",
                        column: x => x.ReviewedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskChangeRequests_CurrentAssignedMemberId",
                table: "TaskChangeRequests",
                column: "CurrentAssignedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskChangeRequests_NewAssignedMemberId",
                table: "TaskChangeRequests",
                column: "NewAssignedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskChangeRequests_RequestedById",
                table: "TaskChangeRequests",
                column: "RequestedById");

            migrationBuilder.CreateIndex(
                name: "IX_TaskChangeRequests_ReviewedById",
                table: "TaskChangeRequests",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_TaskChangeRequests_TaskId",
                table: "TaskChangeRequests",
                column: "TaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskChangeRequests");
        }
    }
}
