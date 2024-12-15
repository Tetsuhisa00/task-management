# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2023_12_22_092023) do
  create_table "deliverables", force: :cascade do |t|
    t.string "name"
    t.integer "project_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_deliverables_on_project_id"
  end

  create_table "priorities", force: :cascade do |t|
    t.string "name", null: false
    t.integer "priority", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "projects", force: :cascade do |t|
    t.string "title"
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "manager_id"
    t.datetime "deadline"
    t.text "customer_requirements"
    t.text "development_input"
    t.text "development_environment"
    t.text "quality_definition"
    t.index ["manager_id"], name: "index_projects_on_manager_id"
  end

  create_table "projects_users", force: :cascade do |t|
    t.integer "project_id", null: false
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_projects_users_on_project_id"
    t.index ["user_id"], name: "index_projects_users_on_user_id"
  end

  create_table "shapes", force: :cascade do |t|
    t.integer "x", null: false
    t.integer "y", null: false
    t.integer "width", null: false
    t.integer "height", null: false
    t.string "shape_type", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "statuses", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "tag_tables", force: :cascade do |t|
    t.integer "tag_id", null: false
    t.integer "task_id", null: false
    t.integer "project_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_tag_tables_on_project_id"
    t.index ["tag_id"], name: "index_tag_tables_on_tag_id"
    t.index ["task_id"], name: "index_tag_tables_on_task_id"
  end

  create_table "tags", force: :cascade do |t|
    t.string "tag_category", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "task_relations", force: :cascade do |t|
    t.integer "start_task_id", null: false
    t.integer "end_task_id", null: false
    t.integer "project_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["end_task_id"], name: "index_task_relations_on_end_task_id"
    t.index ["project_id"], name: "index_task_relations_on_project_id"
    t.index ["start_task_id"], name: "index_task_relations_on_start_task_id"
  end

  create_table "tasks", force: :cascade do |t|
    t.string "title"
    t.integer "user_id"
    t.text "description"
    t.integer "status_id", null: false
    t.integer "priority_id", null: false
    t.date "deadline"
    t.integer "shape_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "project_id"
    t.string "work_output"
    t.date "start_date"
    t.index ["priority_id"], name: "index_tasks_on_priority_id"
    t.index ["shape_id"], name: "index_tasks_on_shape_id"
    t.index ["status_id"], name: "index_tasks_on_status_id"
    t.index ["user_id"], name: "index_tasks_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "user_name", null: false
    t.string "email", null: false
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_supervisor", default: false
  end

  add_foreign_key "deliverables", "projects"
  add_foreign_key "projects", "users", column: "manager_id"
  add_foreign_key "projects_users", "projects"
  add_foreign_key "projects_users", "users"
  add_foreign_key "tag_tables", "projects"
  add_foreign_key "tag_tables", "tags"
  add_foreign_key "tag_tables", "tasks"
  add_foreign_key "task_relations", "projects"
  add_foreign_key "task_relations", "tasks", column: "end_task_id"
  add_foreign_key "task_relations", "tasks", column: "start_task_id"
  add_foreign_key "tasks", "priorities"
  add_foreign_key "tasks", "projects"
  add_foreign_key "tasks", "shapes"
  add_foreign_key "tasks", "statuses"
  add_foreign_key "tasks", "users"
end
